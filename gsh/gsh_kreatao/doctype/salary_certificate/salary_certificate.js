// Copyright (c) 2025, Rawas and contributors
// For license information, please see license.txt

frappe.ui.form.on("Salary Certificate", {
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
            // Set default for content_1 if empty
            if (!frm.doc.content_1) {
                frm.set_value("content_1", `
                    <p><b>Re Number: ${re_number}</b></p>
                    <p><b>${formatted_date}</b></p>
                    <p>To Whom It May Concern</p>
                    <h3 style="text-align:center;"><u>Salary Certificate</u></h3>
                `);
            }
    
            // Set default for content_2 if empty
            if (!frm.doc.content_2) {
                frm.set_value("content_2", `
                    <p><b>Office Address:</b></p>
                    <p>Gulf Specialized Hospital, Al Maktabi building, Al Rumaila street Al Wattaya, Muscat - Sultanate of Oman</p><br>
                    <p>Gulf Specialized Hospital is a multispecialty hospital located in Muscat, Sultanate of Oman. With more than 20 medical & surgical specialties including,
                    Orthopedic, Neurology, Cardiology, Bariatric, Urology, General Surgery, Plastic Surgery, Gastroenterology & others, GSH aims to be the optimal healthcare choice.</p>
                    <p><b>This certificate has been Issued at the Request of the employee Without any liability or Commitment on the Part of GULF Medical Integrated Services
                    towards other parties whatsoever.<b></p>
                    <p><b>“The validity of this certificate shall be one month from the date of issue.”</b></p>
                    Your sincerely,<br><br><br>
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
