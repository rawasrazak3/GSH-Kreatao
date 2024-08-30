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

        let overtimePromise = frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Attendance',
                filters: {
                    employee: employee,
                    attendance_date: ['between', [start_date, end_date]],
                    custom_is_paid: 1,
                    custom_approved: 1,
                    over_time_hours: ['>', 0]
                },
                fields: ['over_time_hours']
            }
        }).then(function(response) {
            let attendances = response.message;
            let total_overtime = 0;

            let promises = attendances.map(function(attendance) {
                return frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Employee',
                        filters: { name: employee },
                        fieldname: 'custom_over_time_rate'
                    }
                }).then(function(res) {
                    let over_time_rate = res.message.custom_over_time_rate || 0;
                    total_overtime += (attendance.over_time_hours * over_time_rate);
                });
            });

            return Promise.all(promises).then(() => total_overtime);
        });

        let lateEntryPromise = frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Attendance',
                filters: {
                    employee: employee,
                    attendance_date: ['between', [start_date, end_date]],
                    late_entry_hours: ['>', 0]
                },
                fields: ['late_entry_hours']
            }
        }).then(function(response) {
            let attendances = response.message;
            let total_late_entry = 0;

            let promises = attendances.map(function(attendance) {
                return frappe.call({
                    method: 'frappe.client.get_value',
                    args: {
                        doctype: 'Employee',
                        filters: { name: employee },
                        fieldname: 'custom_late_entry_rate'
                    }
                }).then(function(res) {
                    let late_entry_rate = res.message.custom_late_entry_rate || 0;
                    total_late_entry += (attendance.late_entry_hours * late_entry_rate);
                });
            });

            return Promise.all(promises).then(() => total_late_entry);
        });

        Promise.all([overtimePromise, lateEntryPromise]).then(function([total_overtime, total_late_entry]) {
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
    });
}

frappe.ui.form.on('Payroll Entry', {
    refresh: function(frm) {
        // Add custom button to Payroll Entry form
        frm.add_custom_button(__('Calculate Saturday Allowance Deduction'), function() {
            // Trigger the calculation
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Salary Slip',
                    filters: {
                        payroll_entry: frm.doc.name
                    },
                    fields: ['name']
                },
                callback: function(r) {
                    if (r.message) {
                        r.message.forEach(slip => {
                            frappe.call({
                                method: 'frappe.client.get',
                                args: {
                                    doctype: 'Salary Slip',
                                    name: slip.name
                                },
                                callback: function(slip_doc) {
                                    calculate_saturday_allowance_deduction(slip_doc);
                                }
                            });
                        });
                    }
                }
            });
        });
    }
});

function calculate_saturday_allowance_deduction(slip_doc) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Attendance',
            filters: {
                employee: slip_doc.employee,
                status: 'Leave',
                leave_type: ['in', ['Annual Leave', 'Maternity Leave', 'Hajj Leave']],
                attendance_date: ['between', [slip_doc.start_date, slip_doc.end_date]]
            },
            fields: ['name']
        },
        callback: function(r) {
            if (r.message) {
                let leave_days = r.message.length;

                let overtime_allowance = slip_doc.earnings.find(row => row.salary_component === 'Saturday Fixed Overtime Allowance');
                if (overtime_allowance) {
                    let per_day_amount = overtime_allowance.default_amount / slip_doc.total_working_days;
                    let deduction_amount = per_day_amount * leave_days;

                    let deduction_component = slip_doc.deductions.find(row => row.salary_component === 'Saturday Allowance Deduction');
                    if (!deduction_component) {
                        slip_doc.deductions.push({
                            'salary_component': 'Saturday Allowance Deduction',
                            'amount': deduction_amount
                        });
                    } else {
                        deduction_component.amount = deduction_amount;
                    }

                    frappe.call({
                        method: 'frappe.client.save',
                        args: {
                            doc: slip_doc
                        },
                        callback: function() {
                            frappe.msgprint(__('Salary Slip updated with Saturday Allowance Deduction.'));
                        }
                    });
                }
            }
        }
    });
}
