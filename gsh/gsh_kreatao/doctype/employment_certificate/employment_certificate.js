// Copyright (c) 2025, Rawas and contributors
// For license information, please see license.txt

frappe.ui.form.on("Employment Certificate", {
	refresh(frm) {

	},
    after_save: function(frm) {
        // frm.save()
        if (!frm.is_new()) {
            // Example dynamic values
            let re_number = frm.doc.name || "HMIS/2025/HR/139";
            let certificate_date = frm.doc.posting_date || frappe.datetime.get_today(); // dynamic date
            // Format date to DD/MM/YYYY
            let parts = certificate_date.split("-");
            let formatted_date = parts[2] + "/" + parts[1] + "/" + parts[0];
            // Set default for content_1 if empty
            if (!frm.doc.content_1) {
                frm.set_value("content_1", `
                    <p><b>Re Number: ${re_number}</b></p>
                    <p><b>Date: ${formatted_date}</b></p>
                    <p><b>To Whom It May Concern</b></p><br>
                    <h2 style="text-align:center;"><u><b>Employment Certificate</b></u></h2>
                `);
            }
    
            // Set default for content_2 if empty
            if (!frm.doc.content_2) {
                frm.set_value("content_2", `
                    <p><b>Gulf Specialized Hospital is a multispecialty hospital located in Muscat, Sultanate of Oman.
                     With more than 20 medical & surgical specialties including, orthopedic, neurology, cardiology, bariatric,
                      urology, general surgery, plastic surgery, gastroenterology & others, gsh aims to be the optimal healthcare choice.<b></p>
                    <p><b>This certificate has been Issued at the Request of the employee Without any liability or 
                    Commitment on the Part of Gulf Medical Integrated Services towards other parties whatsoever.</b></p><br><br><br>
                    <p><b>Zuhair Al Abduwani</b></p>
                    <p><b>CEO</b></p>
                `);
            }
        }
        frm.save()
    },
});
