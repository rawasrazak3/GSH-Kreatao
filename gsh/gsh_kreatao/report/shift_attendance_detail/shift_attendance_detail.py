# Copyright (c) 2026, Rawas and contributors
# For license information, please see license.txt

# import frappe


# def execute(filters=None):
# 	columns, data = [], []
# 	return columns, data

from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import cint, flt, format_datetime, format_duration
from datetime import timedelta, datetime
from frappe.utils import getdate


STATUS_MAP = {
    "Present": "P",
    "Absent": "A",
    "Half Day": "HD",
    "Work From Home": "WFH",
    "On Leave": "L",
    "Holiday": "H",
    "Weekly Off": "WO"
}

def get_all_dates(from_date, to_date):
    from_date = getdate(from_date)
    to_date = getdate(to_date)

    dates = []
    d = from_date
    while d <= to_date:
        dates.append(d)
        d += timedelta(days=1)
    return dates


def is_holiday(date, company):
    holiday_list = frappe.db.get_value("Company", company, "default_holiday_list")
    if not holiday_list:
        return False

    return frappe.db.exists(
        "Holiday",
        {"parent": holiday_list, "holiday_date": date}
    )

def is_weekly_off(date, employee):
    shift = frappe.db.get_value(
        "Shift Assignment",
        {
            "employee": employee,
            "start_date": ["<=", date],
            "docstatus": 1
        },
        "shift_type",
        order_by="start_date desc"
    )

    if not shift:
        return False

    week_day = date.strftime("%A")

    return frappe.db.exists(
        "Shift Type",
        {
            "name": shift,
            "weekly_off": week_day
        }
    )


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	chart = get_chart_data(data)
	report_summary = get_report_summary(data)
	return columns, data, None, chart, report_summary

def get_columns():
	return [
		{
			"label": _("Employee"),
			"fieldname": "employee",
			"fieldtype": "Link",
			"options": "Employee",
			"width": 220,
		},
		{
			"fieldname": "employee_name",
			"fieldtype": "Data",
			"label": _("Employee Name"),
			"width": 0,
			"hidden": 1,
		},
		{
			"label": _("Shift"),
			"fieldname": "shift",
			"fieldtype": "Link",
			"options": "Shift Type",
			"width": 120,
		},
		{
			"label": _("Attendance Date"),
			"fieldname": "attendance_date",
			"fieldtype": "Date",
			"width": 130,
		},
		{
			"label": _("Status"),
			"fieldname": "status",
			"fieldtype": "Data",
			"width": 80,
		},
		{
			"label": _("Shift Start Time"),
			"fieldname": "shift_start",
			"fieldtype": "Data",
			"width": 125,
		},
		{
			"label": _("Shift End Time"),
			"fieldname": "shift_end",
			"fieldtype": "Data",
			"width": 125,
		},
		{
			"label": _("Break Start Time"),
			"fieldname": "break_start",
			"fieldtype": "Data",
			"width": 140,
		},
		{
			"label": _("Break End Time"),
			"fieldname": "break_end",
			"fieldtype": "Data",
			"width": 140,
		},
		{
			"label": _("In Time"),
			"fieldname": "in_time",
			"fieldtype": "Data",
			"width": 120,
		},
		{
			"label": _("First Shift End Time"),
			"fieldname": "first_shift_end",
			"fieldtype": "Data",
			"width": 160,
		},
		{
			"label": _("Second Shift Start Time"),
			"fieldname": "second_shift_start",
			"fieldtype": "Data",
			"width": 170,
		},
		{
			"label": _("Out Time"),
			"fieldname": "out_time",
			"fieldtype": "Data",
			"width": 120,
		},
		{
			"label": _("Total Working Hours"),
			"fieldname": "working_hours",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"label": _("Late Entry By"),
			"fieldname": "late_entry_hrs",
			"fieldtype": "Data",
			"width": 120,
		},
		{
			"label": _("First Shift Early Exit"),
			"fieldname": "first_shift_early_exit",
			"fieldtype": "Data",
			"width": 170,
		},
		{
			"label": _("Second Shift Late Entry"),
			"fieldname": "second_shift_late_entry",
			"fieldtype": "Data",
			"width": 170,
		},
		{
			"label": _("Early Exit By"),
			"fieldname": "early_exit_hrs",
			"fieldtype": "Data",
			"width": 120,
		},
		{
			"label": _("Department"),
			"fieldname": "department",
			"fieldtype": "Link",
			"options": "Department",
			"width": 150,
		},
		{
			"label": _("Company"),
			"fieldname": "company",
			"fieldtype": "Link",
			"options": "Company",
			"width": 150,
		},
		{
			"label": _("Shift Actual Start Time"),
			"fieldname": "shift_actual_start",
			"fieldtype": "Data",
			"width": 165,
		},
		{
			"label": _("Shift Actual End Time"),
			"fieldname": "shift_actual_end",
			"fieldtype": "Data",
			"width": 165,
		},
		{
			"label": _("Attendance ID"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "Attendance",
			"width": 150,
		},
	]


# def get_data(filters):
# 	query = get_query(filters)
# 	data = query.run(as_dict=True)
# 	data = update_data(data, filters)
# 	return data

def get_data(filters):
    # 1. Get existing attendance data
    query = get_query(filters)
    attendance_data = query.run(as_dict=True)

    # 2. Build attendance map (employee + date)
    att_map = {}
    for d in attendance_data:
        att_map.setdefault(d.employee, {})[d.attendance_date] = d

    # 3. Get employees
    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=["name", "employee_name", "department", "company"]
    )

    # 4. Generate ALL dates
    dates = get_all_dates(filters.from_date, filters.to_date)

    final_data = []

    for emp in employees:
        for date in dates:
            entry = att_map.get(emp.name, {}).get(date)

            if entry:
                entry.status = STATUS_MAP.get(entry.status, entry.status)
                final_data.append(entry)
                continue

            # ---- NO ATTENDANCE FOUND → CREATE ROW ----
            status = "A"

            if is_holiday(date, emp.company):
                status = "H"
            elif is_weekly_off(date, emp.name):
                status = "WO"

            final_data.append(frappe._dict({
                "employee": emp.name,
                "employee_name": emp.employee_name,
                "department": emp.department,
                "company": emp.company,
                "attendance_date": date,
                "status": status,
            }))

    # 5. Apply existing calculations
    final_data = update_data(final_data, filters)

    return final_data


def get_report_summary(data):
	if not data:
		return None

	present_records = half_day_records = absent_records = late_entries = early_exits = 0

	for entry in data:
		# if entry.status == "Present":
		# 	present_records += 1
		# elif entry.status == "Half Day":
		# 	half_day_records += 1
		# else:
		# 	absent_records += 1
		if entry.status == "P":
			present_records += 1
		elif entry.status == "HD":
			half_day_records += 1
		elif entry.status == "A":
			absent_records += 1


		if entry.late_entry:
			late_entries += 1
		if entry.early_exit:
			early_exits += 1

	return [
		{
			"value": present_records,
			"indicator": "Green",
			"label": _("Present Records"),
			"datatype": "Int",
		},
		{
			"value": half_day_records,
			"indicator": "Blue",
			"label": _("Half Day Records"),
			"datatype": "Int",
		},
		{
			"value": absent_records,
			"indicator": "Red",
			"label": _("Absent Records"),
			"datatype": "Int",
		},
		{
			"value": late_entries,
			"indicator": "Red",
			"label": _("Late Entries"),
			"datatype": "Int",
		},
		{
			"value": early_exits,
			"indicator": "Red",
			"label": _("Early Exits"),
			"datatype": "Int",
		},
	]


def get_chart_data(data):
	if not data:
		return None

	total_shift_records = {}
	for entry in data:
		if not entry.shift:
			continue

		total_shift_records.setdefault(entry.shift, 0)
		total_shift_records[entry.shift] += 1

	labels = [_(d) for d in list(total_shift_records)]
	chart = {
		"data": {
			"labels": labels,
			"datasets": [{"name": _("Shift"), "values": list(total_shift_records.values())}],
		},
		"type": "percentage",
	}
	return chart


def get_query(filters):
	attendance = frappe.qb.DocType("Attendance")
	checkin = frappe.qb.DocType("Employee Checkin")
	shift_type = frappe.qb.DocType("Shift Type")

	query = (
		frappe.qb.from_(attendance)
		# .inner_join(checkin)
		# .on(checkin.attendance == attendance.name)
		.left_join(checkin)
		.on(checkin.attendance == attendance.name)

		.inner_join(shift_type)
		.on(attendance.shift == shift_type.name)
		.select(
			attendance.name,
			attendance.employee,
			attendance.employee_name,
			attendance.shift,
			attendance.attendance_date,
			attendance.status,
			attendance.in_time,
			attendance.out_time,
			attendance.working_hours,
			attendance.late_entry,
			attendance.early_exit,
			attendance.department,
			attendance.company,
			checkin.shift_start,
			checkin.shift_end,
			checkin.shift_actual_start,
			checkin.shift_actual_end,
			shift_type.enable_late_entry_marking,
			shift_type.late_entry_grace_period,
			shift_type.enable_early_exit_marking,
			shift_type.early_exit_grace_period,
			shift_type.custom_break_start_time.as_("break_start"),
    		shift_type.custom_break_end_time.as_("break_end"),
		)
		.where(attendance.docstatus == 1)
		.groupby(attendance.name)
	)

	for filter in filters:
		if filter == "from_date":
			query = query.where(attendance.attendance_date >= filters.from_date)
		elif filter == "to_date":
			query = query.where(attendance.attendance_date <= filters.to_date)
		elif filter == "consider_grace_period":
			continue
		elif filter == "late_entry" and not filters.consider_grace_period:
			query = query.where(attendance.in_time > checkin.shift_start)
		elif filter == "early_exit" and not filters.consider_grace_period:
			query = query.where(attendance.out_time < checkin.shift_end)
		else:
			query = query.where(attendance[filter] == filters[filter])

	return query


def update_data(data, filters):
	for d in data:
		if not d.get("shift"):
			continue

		update_late_entry(d, filters.consider_grace_period)
		update_early_exit(d, filters.consider_grace_period)

		update_first_second_shift(d)    #first and second shift calculation
		update_first_second_shift_variances(d)   #first shift early exit and second shift late entry calculation

		d.working_hours = format_float_precision(d.working_hours)
		d.in_time, d.out_time = format_in_out_time(d.in_time, d.out_time, d.attendance_date)
		d.shift_start, d.shift_end = convert_datetime_to_time_for_same_date(d.shift_start, d.shift_end)
		d.shift_actual_start, d.shift_actual_end = convert_datetime_to_time_for_same_date(
			d.shift_actual_start, d.shift_actual_end
		)
	return data


def format_float_precision(value):
	precision = cint(frappe.db.get_default("float_precision")) or 2
	return flt(value, precision)


def format_in_out_time(in_time, out_time, attendance_date):
	if in_time and not out_time and in_time.date() == attendance_date:
		in_time = in_time.time()
	elif out_time and not in_time and out_time.date() == attendance_date:
		out_time = out_time.time()
	else:
		in_time, out_time = convert_datetime_to_time_for_same_date(in_time, out_time)
	return in_time, out_time


def convert_datetime_to_time_for_same_date(start, end):
	if start and end and start.date() == end.date():
		start = start.time()
		end = end.time()
	else:
		start = format_datetime(start)
		end = format_datetime(end)
	return start, end


def update_late_entry(entry, consider_grace_period):
	if consider_grace_period:
		if entry.late_entry:
			entry_grace_period = entry.late_entry_grace_period if entry.enable_late_entry_marking else 0
			start_time = entry.shift_start + timedelta(minutes=entry_grace_period)
			entry.late_entry_hrs = entry.in_time - start_time
	elif entry.in_time and entry.in_time > entry.shift_start:
		entry.late_entry = 1
		entry.late_entry_hrs = entry.in_time - entry.shift_start
	if entry.late_entry_hrs:
		entry.late_entry_hrs = format_duration(entry.late_entry_hrs.total_seconds())


def update_early_exit(entry, consider_grace_period):
	if consider_grace_period:
		if entry.early_exit:
			exit_grace_period = entry.early_exit_grace_period if entry.enable_early_exit_marking else 0
			end_time = entry.shift_end - timedelta(minutes=exit_grace_period)
			entry.early_exit_hrs = end_time - entry.out_time
	elif entry.out_time and entry.out_time < entry.shift_end:
		entry.early_exit = 1
		entry.early_exit_hrs = entry.shift_end - entry.out_time
	if entry.early_exit_hrs:
		entry.early_exit_hrs = format_duration(entry.early_exit_hrs.total_seconds())

# convert timedelta to time
def timedelta_to_time(td):
    if not td:
        return None
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return datetime.strptime(f"{hours:02d}:{minutes:02d}:{seconds:02d}", "%H:%M:%S").time()


# get employee checkins for a given employee and attendance date
def get_employee_checkins(employee, attendance_date):
    return frappe.get_all(
        "Employee Checkin",
        filters={
            "employee": employee,
            "time": ["between", [
                f"{attendance_date} 00:00:00",
                f"{attendance_date} 23:59:59"
            ]]
        },
        fields=["time"],
        order_by="time asc"
    )

# calculate first shift end and second shift 
def update_first_second_shift(entry):
    if not entry.break_start or not entry.break_end:
        return

    break_start = timedelta_to_time(entry.break_start)
    break_end = timedelta_to_time(entry.break_end)

    checkins = get_employee_checkins(entry.employee, entry.attendance_date)
    if not checkins:
        return

    first_shift_end = None
    second_shift_start = None

    for c in checkins:
        t = c.time.time()

        if t <= break_start:
            first_shift_end = t

        if t >= break_end and not second_shift_start:
            second_shift_start = t

    entry.first_shift_end = first_shift_end
    entry.second_shift_start = second_shift_start


# calculate first shift early exit and second shift late entry
def update_first_second_shift_variances(entry):
    # Safety checks
    if not entry.break_start or not entry.break_end:
        return

    # Convert timedelta → time
    break_start = timedelta_to_time(entry.break_start)
    break_end   = timedelta_to_time(entry.break_end)

    if not entry.first_shift_end or not entry.second_shift_start:
        return

    # ---- First Shift Early Exit ----
    if entry.first_shift_end < break_start:
        diff = datetime.combine(entry.attendance_date, break_start) - \
               datetime.combine(entry.attendance_date, entry.first_shift_end)
        entry.first_shift_early_exit = format_duration(diff.total_seconds())

    # ---- Second Shift Late Entry ----
    if entry.second_shift_start > break_end:
        diff = datetime.combine(entry.attendance_date, entry.second_shift_start) - \
               datetime.combine(entry.attendance_date, break_end)
        entry.second_shift_late_entry = format_duration(diff.total_seconds())



