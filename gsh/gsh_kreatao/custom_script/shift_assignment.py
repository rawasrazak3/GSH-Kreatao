import frappe
from frappe.utils import getdate, nowdate
from datetime import date

SHIFT_TYPES_TO_ADD = ["Weekly Off", "Public Holiday", "On Call Shift", "On Call Day", "On Call Night"]
SHIFT_TYPES_WEEKLY_OFF = ["Weekly Off", "On Call Shift", "On Call Day", "On Call Night"]

def add_shift_assignment_date_to_holiday_list(doc, method):
    if doc.shift_type not in SHIFT_TYPES_TO_ADD:
        return

    employee = frappe.get_doc("Employee", doc.employee)
    holiday_list_name = employee.holiday_list

    today = getdate(nowdate())
    from_date = date(today.year, 1, 1)
    to_date = date(today.year + 25, 12, 31)

    # If no holiday list, create one
    if not holiday_list_name:
        holiday_list_name = f"{employee.attendance_device_id}:{employee.employee_name}"
        if not frappe.db.exists("Holiday List", holiday_list_name):
            holiday_list = frappe.new_doc("Holiday List")
            holiday_list.holiday_list_name = holiday_list_name
            holiday_list.from_date = from_date
            holiday_list.to_date = to_date
            holiday_list.is_default = 0
            holiday_list.save()
        frappe.db.set_value("Employee", employee.name, "holiday_list", holiday_list_name)

    holiday_list = frappe.get_doc("Holiday List", holiday_list_name)

    # Check if holiday already added
    if not any(holiday.holiday_date == doc.start_date for holiday in holiday_list.holidays):
        holiday_entry = {
            "holiday_date": doc.start_date,
            "description": f"{doc.shift_type}"
        }

        # Add weekly_off flag conditionally
        if doc.shift_type in SHIFT_TYPES_WEEKLY_OFF:
            holiday_entry["weekly_off"] = 1

        holiday_list.append("holidays", holiday_entry)
        holiday_list.save()
