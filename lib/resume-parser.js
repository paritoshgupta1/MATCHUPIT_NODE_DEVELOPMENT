const Promise = require('bluebird');

exports.linkedin = function find(pdf_data) {
  return new Promise((resolve, reject) => {	
		let topic_list=["Top Skills","Languages","Honors-Awards","Summary","Experience","Education","Certifications"]
		let result_list=[]

        let weird = ["\xa0", "\uf0da", "\x0c", "• ", "* ", "(LinkedIn)", " (LinkedIn)", "\uf0a7", "-       ", "●"]
        for (const val of weird) {
            pdf_data = pdf_data.replace(val, "");
        }
		let total_page=1

        resume_data = pdf_data.split('\n')
		
		for (const row of resume_data) {
			
			if(topic_list.indexOf(row) > -1)
			{
				result_list.push('SectionEND')
			}
			
			if(row.indexOf("Page 1 of ") > -1)
			{
				total_page=row.replace("Page 1 of ","")
			}
			
			if(row.length>0)
			{
			result_list.push(row)
			}
			

			
		}
		
		
		let pg=total_page
		while(total_page>0)
		{
			result_list.splice(result_list.indexOf("Page "+total_page+" of "+pg), 1);
			total_page=total_page-1
		}
		
		
		
		
		//console.log(result_list)

        let skills = []
        let languages = []
        let summary = []
        let certifications = []
        let address = []
        let name = ''
        let tagline = ''
        let location = ''
        let linkedin = ''
        let email = ''
        let contact = ''
        let honors_awards = []
        let experience = []
        let education = []
        let exp_dict = {}
        let edu_dict = {}
        let alld = {}

        for (const i of result_list) {
            if (i == 'Contact') {
                let value = result_list.indexOf(i)
                while (true) {
                    value = value + 1
                    address.push((result_list[value]))
                    if (result_list[value] == 'SectionEND' ) {
                        address.splice(address.indexOf(result_list[value]), 1);
                        break;
                    }
					
						
                }
            }

            
			
			if (i == 'Top Skills') {
                let value = result_list.indexOf(i)
                while (true) {
                    value = value + 1
					
                    skills.push(result_list[value])
                    if (result_list[value] == 'SectionEND') {
                        skills.splice(skills.indexOf(result_list[value]), 1);
                        break;
                    }
					
                }
            }
			
			
			
			
			if (i == 'Languages') {
                let value = result_list.indexOf(i)
                while (true) {
                    value = value + 1
                    languages.push((result_list[value]))
                    if (result_list[value] == 'SectionEND') {
                        languages.splice(languages.indexOf(result_list[value]), 1);
                        break;
                    }
                }
            }
			
			if (i == 'Honors-Awards') {
                let value = result_list.indexOf(i)
                while (true) {
                    value = value + 1
                    honors_awards.push(result_list[value])
                    if (result_list[value] == 'SectionEND') {
                        honors_awards.splice(honors_awards.indexOf(result_list[value]), 1);
                        break;
                    }
                }
            }
			if (i == 'Certifications') {
                let value = result_list.indexOf(i)
                while (true) {
                    value = value + 1
                    certifications.push(result_list[value])
                    if (result_list[value] == 'SectionEND') {
                        certifications.splice(certifications.indexOf(result_list[value]), 1);
                        break;
                    }
                }
            }
			
			
			if (i == 'Summary') {
                let value = result_list.indexOf(i)
				name=result_list[value-4]
				tagline=result_list[value-3]
				location=result_list[value-2]
                while (true) {
                    value = value + 1
                    summary.push(result_list[value])
                    if (result_list[value] == 'SectionEND') {
                        summary.splice(summary.indexOf(result_list[value]), 1);
                        break;
                    }
                }
            }
			
			if (i == 'Education') {
                if(result_list.indexOf('Summary')==-1)
				{
				
				let value = result_list.indexOf(i)
				name=result_list[value-5]
				tagline=result_list[value-4]
				location=result_list[value-3]
					
				}
				let value = result_list.indexOf(i)
				value = value + 1
				
				education.push({"schoo":result_list[value],"degree":result_list[value+1]})
				
				while (true) {
                    value = value + 2
					
				   if (typeof result_list[value] == 'undefined' || result_list[value]=='' || result_list[value]=='SectionEND' ) {
                        //summary.splice(summary.indexOf(result_list[value]), 1);
						
                        break;
                    }
					if(result_list[value].length>3)
				   {
					education.push({"schoo":result_list[value],"degree":result_list[value+1]})
                   }
					
                }
				
				
            }
			
			if (i == 'Experience') {
                let value = result_list.indexOf(i)
				
				let month_list=["January","February","March","April","May","June","July","August","September","October","November","December"]
				
                while (true) {
                    value = value + 1
                    
				
					for (var j = month_list.length - 1; j >= 0; --j) {
						if (result_list[value].indexOf(month_list[j]) != -1) {
							
							experience.push({"company":result_list[value-2],"position":result_list[value-1],"period":result_list[value],"location":result_list[value+1]})
							
							break;
						}
					}
					
			
                    if (result_list[value] == 'SectionEND') {
                       // certifications.splice(certifications.indexOf(result_list[value]), 1);
                        break;
                    }
                }
            }
			
			
			
		
				if(i.indexOf('www.linkedin.com') !== -1)
			{
				linkedin=(i)
				address.splice(address.indexOf(i), 1);
			}
			
			if(i.indexOf('@')!== -1 && i.indexOf('.')!== -1)
			{
				email=i;
				address.splice(address.indexOf(i), 1);
			}
			
				if(i.indexOf('(Mobile)') !== -1)
			{
				contact=(i.replace("(Mobile)",""))
				address.splice(address.indexOf(i), 1);
			}
			
			if(i.indexOf('(Home)') !== -1)
						{
							contact=(i.replace("(Home)",""))
							address.splice(address.indexOf(i), 1);
						}
			
			
			
			
			
			
        }

		//remove name from different Cat Array
		certifications.splice(certifications.indexOf(name), 1);
		certifications.splice(certifications.indexOf(tagline), 1);
		certifications.splice(certifications.indexOf(address), 1);
		
		
		honors_awards.splice(honors_awards.indexOf(name), 1);
		honors_awards.splice(honors_awards.indexOf(tagline), 1);
		honors_awards.splice(honors_awards.indexOf(address), 1);
		
		languages.splice(languages.indexOf(name), 1);
		languages.splice(languages.indexOf(tagline), 1);
		languages.splice(languages.indexOf(address), 1);
		
		
		
		
		
		
		//JSON Output formatting
        let alldaa = {}
        alldaa.name = name;
        alldaa.tagline = tagline;
        alldaa.location = location;
        alldaa.address = address;
		alldaa.email = email;
		alldaa.contact = contact;
		alldaa.linkedin = linkedin;
        alldaa.skills = skills;
        alldaa.languages = languages;
        alldaa.certifications = certifications;
        alldaa.honors_awards = honors_awards;
        alldaa.summary = summary;
        alldaa.education = education;
        alldaa.experience = experience;
		
    resolve(alldaa);
  });
};
