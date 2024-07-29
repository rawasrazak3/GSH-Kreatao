frappe.ui.form.on('Salary Slip', {
    refresh: function(frm) {
        frm.add_custom_button(__('Get Overtime and Late Entry'), function() {
            calculate_overtime_and_late_entry(frm);
        });
    }
});

function calculate_overtime_and_late_entry(frm) {
    let start_date = frm.doc.start_date;
    let end_date = frm.doc.end_date;
    let employee = frm.doc.employee;

    let total_overtime = 0;
    let total_late_entry = 0;

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

        return Promise.all(promises);
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

        return Promise.all(promises);
    });

    Promise.all([overtimePromise, lateEntryPromise]).then(function() {
        let overtime_exists = frm.doc.earnings.some(e => e.salary_component === 'Overtime');
        let late_entry_exists = frm.doc.deductions.some(d => d.salary_component === 'Late Hours');

        if (overtime_exists) {
            frm.doc.earnings.forEach(e => {
                if (e.salary_component === 'Overtime') {
                    e.amount = total_overtime;
                }
            });
        } else {
            frm.add_child('earnings', {
                salary_component: 'Overtime',
                amount: total_overtime
            });
        }

        if (late_entry_exists) {
            frm.doc.deductions.forEach(d => {
                if (d.salary_component === 'Late Hours') {
                    d.amount = total_late_entry;
                }
            });
        } else {
            frm.add_child('deductions', {
                salary_component: 'Late Hours',
                amount: total_late_entry
            });
        }

        frm.refresh_field('earnings');
        frm.refresh_field('deductions');
    });
}
