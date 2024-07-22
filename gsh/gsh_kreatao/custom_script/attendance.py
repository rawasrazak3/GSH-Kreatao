from __future__ import unicode_literals
import frappe
from frappe import _

def calculate_hours(doc, method):
    if doc.working_hours and doc.custom_total_hours:

        working_hours = doc.working_hours
        total_hours = doc.custom_total_hours

        difference = working_hours - total_hours
        print("difference =", difference)

        if difference >= 0:
            frappe.db.set_value("Attendance", doc.name, 'over_time_hours', float(difference))
            frappe.db.set_value("Attendance", doc.name, 'late_entry_hours', 0.00)
            print("overtime=",doc.over_time_hours)
        else:
            frappe.db.set_value("Attendance", doc.name, 'late_entry_hours', float(-difference))
            frappe.db.set_value("Attendance", doc.name, 'over_time_hours', 0.00)
            print("late entry =",doc.late_entry_hours)