// Copyright (c) 2025, Rawas and contributors
// For license information, please see license.txt

frappe.ui.form.on("Salary Certificate", {
	refresh(frm) {

	},
    employee: function(frm) {
        console.log("Employee selected:", frm.doc.employee);
        
        frappe.call({
            method: 'gsh.gsh_kreatao.doctype.salary_certificate.salary_certificate.get_salary_detail',
            args: {
                employee: frm.doc.employee
            },
            callback: function(r) {
                console.log("Response:", r);
                
                if (r.message) {
                    console.log("Message received:", r.message);
                    
                    
                    frm.set_value("salary", r.message.base);
                } else {
                    console.log("No message received.");
                }
            },
            error: function(err) {
                console.log("Error occurred:", err);
            }
        });
    }
});
