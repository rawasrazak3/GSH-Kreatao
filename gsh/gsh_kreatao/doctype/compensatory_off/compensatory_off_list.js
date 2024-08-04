// frappe.listview_settings['Compensatory Off'] = {
//     onload: function(listview) {
//         listview.page.add_action_item(__('Create Leave Application'), function() {
//             let selected = listview.get_checked_items();
//             console.log(selected)
//             if (selected.length === 0) {
//                 frappe.msgprint(__('Please select at least one entry'));
//                 return;
//             }

//             let employees = selected.map(item => item.employee);
//             console.log(employees)
//             console.log(employees[0])
//             let employee_names = selected.map(item => item.employee_name);
//             let from_dates = selected.map(item => item.from_date);
//             let to_dates = selected.map(item => item.to_date);
//             let over_time_hours = selected.reduce((sum, item) => sum + parseFloat(item.over_time_hours || 0), 0);

//             if (new Set(employees).size !== 1) {
//                 frappe.msgprint(__('Please select entries for the same employee'));
//                 return;
//             }

//             let dialog = new frappe.ui.Dialog({
//                 title: __('Create Leave Application'),
//                 fields: [
//                     {'fieldname': 'employee', 'fieldtype': 'Data', 'label': 'Employee', 'read_only': 1, 'default': employees[0]},
//                     {'fieldname': 'employee_name', 'fieldtype': 'Data', 'label': 'Employee Name', 'read_only': 1, 'default': employee_names[0]},
//                     {'fieldname': 'total_hours', 'fieldtype': 'Float', 'label': 'Total Hours', 'read_only': 1, 'default': over_time_hours},
//                     {'fieldname': 'from_date', 'fieldtype': 'Date', 'label': 'From Date', 'reqd': 1, 'default': from_dates[0]},
//                     {'fieldname': 'to_date', 'fieldtype': 'Date', 'label': 'To Date', 'reqd': 1, 'default': to_dates[to_dates.length - 1]},
//                     {'fieldname': 'leave_type', 'fieldtype': 'Link', 'label': 'Leave Type', 'reqd': 1, 'options': 'Leave Type'}
//                 ],
//                 primary_action: function(values) {
//                     frappe.call({
//                         method: 'gsh.gsh_kreatao.doctype.compensatory_off.compensatory_off.create_leave_application',
//                         args: {
//                             employee: values.employee,
//                             from_date: values.from_date,
//                             to_date: values.to_date,
//                             leave_type: values.leave_type
//                         },
//                         callback: function(r) {
//                             if (r.message) {
//                                 frappe.call({
//                                     method: 'gsh.gsh_kreatao.doctype.compensatory_off.compensatory_off.create_leave_application',
//                                     args: {
//                                         employee: values.employee,
//                                         from_date: values.from_date,
//                                         to_date: values.to_date,
//                                         leave_type: values.leave_type
//                                     },
//                                     callback: function(r) {
//                                         if (r.message) {
//                                             frappe.msgprint(__('Leave Application created successfully'));
//                                             dialog.hide();
//                                         }
//                                     }
//                                 });
//                                 frappe.msgprint(__('Leave Application created successfully'));
//                                 dialog.hide();
//                             }
//                         }
//                     });
//                 },
//                 primary_action_label: __('Create')
//             });

//             dialog.show();
//         });
//     }
// };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// frappe.listview_settings['Compensatory Off'] = {
//     onload: function(listview) {
//         listview.page.add_action_item(__('Create Leave Application'), function() {
//             let selected = listview.get_checked_items();
//             if (selected.length === 0) {
//                 frappe.msgprint(__('Please select at least one entry'));
//                 return;
//             }

//             let employees = selected.map(item => item.employee);
//             let employee_names = selected.map(item => item.employee_name);
//             let from_dates = selected.map(item => item.from_date);
//             let to_dates = selected.map(item => item.to_date);
//             let over_time_hours = selected.reduce((sum, item) => sum + parseFloat(item.over_time_hours || 0), 0);

//             if (new Set(employees).size !== 1) {
//                 frappe.msgprint(__('Please select entries for the same employee'));
//                 return;
//             }

//             frappe.call({
//                 method: 'gsh.gsh_kreatao.doctype.compensatory_leave.compensatory_leave.check_is_allocated',
//                 args: {
//                     selected_entries: selected.map(item => item.name)
//                 },
//                 callback: function(r) {
//                     if (r.message) {
//                         frappe.msgprint(__('Leave application already created for entry: ' + r.message));
//                     } else {
//                         let dialog = new frappe.ui.Dialog({
//                             title: __('Create Leave Application'),
//                             fields: [
//                                 {'fieldname': 'employee', 'fieldtype': 'Data', 'label': 'Employee', 'read_only': 1, 'default': employees[0]},
//                                 {'fieldname': 'employee_name', 'fieldtype': 'Data', 'label': 'Employee Name', 'read_only': 1, 'default': employee_names[0]},
//                                 {'fieldname': 'total_hours', 'fieldtype': 'Float', 'label': 'Total Hours', 'read_only': 1, 'default': over_time_hours},
//                                 {'fieldname': 'from_date', 'fieldtype': 'Date', 'label': 'From Date', 'reqd': 1, 'default': from_dates[0]},
//                                 {'fieldname': 'to_date', 'fieldtype': 'Date', 'label': 'To Date', 'reqd': 1, 'default': to_dates[to_dates.length - 1]},
//                                 {'fieldname': 'leave_type', 'fieldtype': 'Link', 'label': 'Leave Type', 'reqd': 1, 'options': 'Leave Type'}
//                             ],
//                             primary_action: function(values) {
//                                 frappe.call({
//                                     method: 'gsh.gsh_kreatao.doctype.compensatory_leave.compensatory_leave.create_leave_application_with_allocation_check',
//                                     args: {
//                                         selected_entries: selected.map(item => item.name),
//                                         employee: values.employee,
//                                         from_date: values.from_date,
//                                         to_date: values.to_date,
//                                         leave_type: values.leave_type
//                                     },
//                                     callback: function(r) {
//                                         if (r.message === 'create_allocation') {
//                                             frappe.confirm(
//                                                 __('No Leave Allocation found for this employee and leave type. Do you want to create one?'),
//                                                 function() {
//                                                     frappe.call({
//                                                         method: 'gsh.gsh_kreatao.doctype.compensatory_leave.compensatory_leave.api.create_leave_allocation',
//                                                         args: {
//                                                             employee: values.employee,
//                                                             from_date: values.from_date,
//                                                             to_date: values.to_date,
//                                                             leave_type: values.leave_type
//                                                         },
//                                                         callback: function(r) {
//                                                             if (r.message) {
//                                                                 frappe.msgprint(__('Leave Allocation created successfully'));
//                                                                 dialog.hide();
//                                                             }
//                                                         }
//                                                     });
//                                                 }
//                                             );
//                                         } else if (r.message === 'allocation_updated') {
//                                             frappe.msgprint(__('Leave Allocation updated successfully'));
//                                             dialog.hide();
//                                         } else {
//                                             frappe.msgprint(__('Leave Application created successfully'));
//                                             dialog.hide();
//                                         }
//                                     }
//                                 });
//                             },
//                             primary_action_label: __('Create')
//                         });

//                         dialog.show();
//                     }
//                 }
//             });
//         });
//     }
// };

frappe.listview_settings['Compensatory Off'] = {
    onload: function(listview) {
        listview.page.add_action_item(__('Create Leave Application'), function() {
            let selected = listview.get_checked_items();
            if (selected.length === 0) {
                frappe.msgprint(__('Please select at least one entry'));
                return;
            }

            let employees = selected.map(item => item.employee);
            let employee_names = selected.map(item => item.employee_name);
            let from_dates = selected.map(item => item.from_date);
            let to_dates = selected.map(item => item.to_date);
            let over_time_hours = selected.reduce((sum, item) => sum + parseFloat(item.over_time_hours || 0), 0);

            if (new Set(employees).size !== 1) {
                frappe.msgprint(__('Please select entries for the same employee'));
                return;
            }

            let dialog = new frappe.ui.Dialog({
                title: __('Create Leave Application'),
                fields: [
                    {'fieldname': 'employee', 'fieldtype': 'Data', 'label': 'Employee', 'read_only': 1, 'default': employees[0]},
                    {'fieldname': 'employee_name', 'fieldtype': 'Data', 'label': 'Employee Name', 'read_only': 1, 'default': employee_names[0]},
                    {'fieldname': 'total_hours', 'fieldtype': 'Float', 'label': 'Total Hours', 'read_only': 1, 'default': over_time_hours},
                    {'fieldname': 'from_date', 'fieldtype': 'Date', 'label': 'From Date', 'reqd': 1, 'default': from_dates[0]},
                    {'fieldname': 'to_date', 'fieldtype': 'Date', 'label': 'To Date', 'reqd': 1, 'default': to_dates[to_dates.length - 1]},
                    {'fieldname': 'leave_type', 'fieldtype': 'Link', 'label': 'Leave Type', 'reqd': 1, 'options': 'Leave Type'}
                ],
                primary_action: function(values) {
                    frappe.call({
                        method: 'gsh.gsh_kreatao.doctype.compensatory_off.compensatory_off.check_and_create_leave_application',
                        args: {
                            employee: values.employee,
                            from_date: values.from_date,
                            to_date: values.to_date,
                            leave_type: values.leave_type
                        },
                        callback: function(r) {
                            if (r.message === 'create_allocation') {
                                frappe.confirm(
                                    __('No Leave Allocation found for this employee and leave type. Do you want to create one?'),
                                    function() {
                                        frappe.call({
                                            method: 'gsh.gsh_kreatao.doctype.compensatory_off.compensatory_off.create_leave_allocation',
                                            args: {
                                                employee: values.employee,
                                                from_date: values.from_date,
                                                to_date: values.to_date,
                                                leave_type: values.leave_type
                                            },
                                            callback: function(r) {
                                                if (r.message) {
                                                    frappe.msgprint(__('Leave Application created successfully'));
                                                    dialog.hide();
                                                }
                                            }
                                        });
                                    }
                                );
                            } else if (r.message === 'allocation_updated') {
                                frappe.msgprint(__('Leave Application created successfully'));
                                dialog.hide();
                            } else {
                                frappe.msgprint(__('Leave Application created successfully'));
                                dialog.hide();
                            }
                        }
                    });
                },
                primary_action_label: __('Create')
            });

            dialog.show();
        });
    }
};
