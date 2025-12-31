// Copyright (c) 2025, Rawas and contributors
// For license information, please see license.txt


frappe.ui.form.on("Salary Transfer Certificate", {
	refresh(frm) {

	},
    after_save: function(frm) {
        // frm.save()
        if (!frm.is_new()) {
            // Example dynamic values
            let re_number = frm.doc.name || "GMIS/2025/HR/144";
            let certificate_date = frm.doc.posting_date || frappe.datetime.get_today(); // dynamic date
            // Format date to DD/MM/YYYY
            let parts = certificate_date.split("-");
            let formatted_date = parts[2] + "/" + parts[1] + "/" + parts[0];
            // Dynamic bank details
            let bank_name = frm.doc.bank_name || "____________";
            let ac_no = frm.doc.ac_no || "____________";
            // Set default for content_1 if empty
            if (!frm.doc.content_1) {
                frm.set_value("content_1", `
                    <p><b>Re Number: ${re_number}</b></p>
                    <p><b>Date: ${formatted_date}</b></p>
                    <p><b>To Whom It May Concern</b></p>
                    <h2 style="text-align:center;"><u><b>Salary Transfer Certificate</b></u></h2>
                `);
            }
    
            // Set default for content_2 if empty
            if (!frm.doc.content_2) {
                frm.set_value("content_2", `
                    <p>This is to certify that the above-mentioned employee is training in Gulf Medical Integrated Services 
                    as per the information provided above. 
                    Furthermore, as per his request we confirm that his monthly pay will be transferred to his 
                    <b>${bank_name}</b> account number <b>${ac_no}</b>.</p>
                    <p>This document has been issued at the request of the employee. 
                    Please be advised that GMIS does not bear any responsibility, nor does it undertake any obligations, 
                    towards third parties in relation to this certification.</p><br>
                    <p>Sincerely yours,</p><br><br>
                    <p><b>Zuhair Al Abduwani</b></p>
                    <p><b>CEO</b></p>
                `);
            }
        }
        frm.save()
    },
    employee: function(frm) {
        console.log("Employee selected:", frm.doc.employee);
        
        frappe.call({
            method: 'gsh.gsh_kreatao.doctype.salary_transfer_certificate.salary_transfer_certificate.get_salary_detail',
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
