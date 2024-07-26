frappe.ui.form.on('Payroll Entry', {
    refresh: function(frm) {
        frm.add_custom_button(__('Get Overtime and Late Entry'), function() {
            get_overtime_and_late_entry_for_all_salary_slips(frm);
        });
    }
});

function get_overtime_and_late_entry_for_all_salary_slips(frm) {
    let payroll_entry = frm.doc.name;

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Salary Slip',
            filters: {
                payroll_entry: payroll_entry,
                docstatus: 0
            },
            fields: ['name', 'employee', 'start_date', 'end_date']
        },
        callback: function(response) {
            let salary_slips = response.message;

            let promises = salary_slips.map(function(slip) {
                return calculate_overtime_and_late_entry(slip);
            });

            Promise.all(promises).then(function() {
                frappe.msgprint(__('Overtime and Late Entry amounts have been updated for all salary slips.'));
                frm.reload_doc();
            });
        }
    });
}

function calculate_overtime_and_late_entry(slip) {
    return new Promise(function(resolve, reject) {
        let start_date = slip.start_date;
        let end_date = slip.end_date;
        let employee = slip.employee;
        let salary_slip_name = slip.name;

        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Attendance',
                filters: {
                    employee: employee,
                    attendance_date: ['between', [start_date, end_date]],
                    custom_is_paid: 1,
                    custom_approved: 1
                },
                fields: ['over_time_hours', 'late_entry_hours']
            },
            callback: function(response) {
                let attendances = response.message;
                let total_overtime = 0;
                let total_late_entry = 0;

                let promises = attendances.map(function(attendance) {
                    if (attendance.over_time_hours > 0 && attendance.late_entry_hours === 0) {
                        return frappe.call({
                            method: 'frappe.client.get_value',
                            args: {
                                doctype: 'Employee',
                                filters: { name: employee },
                                fieldname: 'custom_over_time_rate'
                            }
                        }).then(function(res) {
                            let over_time_rate = res.message.custom_over_time_rate || 0;
                            console.log("Overtime Rate:", over_time_rate); 
                            total_overtime += (attendance.over_time_hours * over_time_rate);
                            console.log("Total Overtime:", total_overtime);
                        });
                    } else if (attendance.late_entry_hours > 0 && attendance.over_time_hours === 0) {
                        return frappe.call({
                            method: 'frappe.client.get_value',
                            args: {
                                doctype: 'Employee',
                                filters: { name: employee },
                                fieldname: 'custom_late_entry_rate'
                            }
                        }).then(function(res) {
                            let late_entry_rate = res.message.custom_late_entry_rate || 0;
                            console.log("Late Entry Rate:", late_entry_rate);
                            total_late_entry += (attendance.late_entry_hours * late_entry_rate);
                            console.log("Total Late Entry:", total_late_entry);
                        });
                    }
                    return Promise.resolve();
                });

                Promise.all(promises).then(function() {
                    console.log("Final Total Overtime:", total_overtime);
                    console.log("Final Total Late Entry:", total_late_entry);

                    frappe.call({
                        method: 'frappe.client.get',
                        args: {
                            doctype: 'Salary Slip',
                            name: salary_slip_name
                        },
                        callback: function(r) {
                            let salary_slip = r.message;
                            let earnings = salary_slip.earnings || [];
                            let deductions = salary_slip.deductions || [];

                            let overtime_entry = earnings.find(e => e.salary_component === 'Overtime');
                            if (overtime_entry) {
                                overtime_entry.amount = total_overtime;
                            } else {
                                earnings.push({
                                    salary_component: 'Overtime',
                                    amount: total_overtime
                                });
                            }

                            let late_hours_entry = deductions.find(d => d.salary_component === 'Late Hours');
                            if (late_hours_entry) {
                                late_hours_entry.amount = total_late_entry;
                            } else {
                                deductions.push({
                                    salary_component: 'Late Hours',
                                    amount: total_late_entry
                                });
                            }

                            frappe.call({
                                method: 'frappe.client.set_value',
                                args: {
                                    doctype: 'Salary Slip',
                                    name: salary_slip_name,
                                    fieldname: {
                                        earnings: earnings,
                                        deductions: deductions
                                    }
                                },
                                callback: function() {
                                    resolve();
                                }
                            });
                        }
                    });
                });
            }
        });
    });
}
