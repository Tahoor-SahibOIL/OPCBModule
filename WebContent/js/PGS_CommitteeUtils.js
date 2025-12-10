define(["ecm/externalJS/CustomJS"], function (KGOCCustomJS) {

    return {
        getPRCCommittee: function () {
            var reviewCommittee = [];
                       
            window.KGOCDirectorates.filter(function (x) { return x.Location === "HO"; }).forEach(item => {
                if (item.DirectorateCode === "T&CA") {
                    reviewCommittee.push({ TeamCode: item.DirectorateCode, TeamName: item.DirectorateName, TeamLeader: item.DCEO });
                }
            });
                     
            window.KGOCUsers.filter(function (x) { return x.Location === "HO"; }).forEach(item => {
                if (item.directorate === "T&CA") {
                    reviewCommittee.push({ TeamCode: item.directorate, TeamName: item.directorateName, TeamLeader: item.manager });
                }
            });
        

            window.KGOCGroups.filter(function (x) { return x.Location === "HO"; }).forEach(item => {
                if (item.GroupCode === "FS") {
                    reviewCommittee.push({ TeamCode: item.GroupCode, TeamName: item.GroupName, TeamLeader: item.Manager });
                }  else if (item.GroupCode === "RM") {
                    reviewCommittee.push({ TeamCode: item.GroupCode, TeamName: item.GroupName, TeamLeader: item.Manager });
                } else if (item.GroupCode === "CP") {
                    reviewCommittee.push({ TeamCode: item.GroupCode, TeamName: item.GroupName, TeamLeader: item.Manager });
                } else if (item.GroupCode === "CA") {
                    reviewCommittee.push({ TeamCode: item.GroupCode, TeamName: item.GroupName, TeamLeader: item.Manager });
                } else if (item.GroupCode === "LA") {
                    reviewCommittee.push({ TeamCode: item.GroupCode, TeamName: item.GroupName, TeamLeader: item.Manager });
                }               
            });

            return reviewCommittee;

        },

        prcReviewCallBack: function(wiEditable, params,taskEditable,currentStage)
        {
            var customJS = new KGOCCustomJS();
            
            var currentCase = wiEditable.getCase();
            var infoMessage = "PRC Committee requested your team to review the DSP Details & documents";
            taskEditable.setTaskName("PRC Committee Review - " + params.TeamCode); 
            var subDate = new Date();
            
            var taskUser = customJS.getWorkflowUser(wiEditable.repository.id, params.TeamLeader);
            taskEditable.getProperty("F_CaseTask", "OPCB_DepartmentCode").setValue(params.TeamCode);
            taskEditable.getProperty("F_CaseTask", "OPCB_CurrentStage").setValue(currentStage);
            taskEditable.getProperty("F_CaseTask", "OPCB_ActivityUser").setValue(params.TeamLeader);
            taskEditable.getProperty("F_CaseTask", "OPCB_InfoMessage").setValue(infoMessage);
            taskEditable.getProperty("F_CaseTask", "OPCB_ReminderCount").setValue(0);
            taskEditable.getProperty("F_CaseTask", "OPCB_SubmissionDate").setValue(subDate);
            taskEditable.getProperty("F_CaseTask", "OPCB_PRCCommittee").setValue([]);
            taskEditable.getProperty("F_CaseTask", "OPCB_Comments").setValue([]);
            taskEditable.getProperty("F_CaseTask", "OPCB_SubmissionDateNew").setValue([]);
            taskEditable.getProperty("F_CaseTask", "CurrentStatus").setValue("Requested");
            taskEditable.getProperty("F_CaseTask", "OPCB_Location").setValue(taskUser.displayName);
            // taskEditable.launchStep.getProperty("F_WorkflowField", "PRC_Committee").setValue(taskUser);
            taskEditable.save(function(){
                currentCase.addTaskComment(205, infoMessage, taskEditable.id, null, null, true);
            },
            function(e) {
                console.log("Error on Submission " + params.TeamCode, e);
            }, true);
        },

        prcReviewStageCallBack: function(wiEditable, params,taskEditable)
        {
            var customJS = new KGOCCustomJS();
            
            var currentCase = wiEditable.getCase();
            var infoMessage = "Initializtion of Stage 3 by LC Coordinator";
            taskEditable.setTaskName("PRC Review Cycle Stage" ); 
            var subDate = new Date();
            
            var taskUser = customJS.getWorkflowUser(wiEditable.repository.id, params.TeamLeader);
           
            taskEditable.getProperty("F_CaseTask", "OPCB_DepartmentCode").setValue(params.TeamCode);
            taskEditable.getProperty("F_CaseTask", "OPCB_ActivityUser").setValue(params.TeamLeader);
            taskEditable.getProperty("F_CaseTask", "OPCB_InfoMessage").setValue(infoMessage);
            taskEditable.getProperty("F_CaseTask", "OPCB_SubmissionDate").setValue(subDate);
            taskEditable.getProperty("F_CaseTask", "OPCB_Comments").setValue([]);
            taskEditable.getProperty("F_CaseTask", "OPCB_SubmissionDateNew").setValue([]);
            taskEditable.getProperty("F_CaseTask", "CurrentStatus").setValue("Initiated");
            taskEditable.getProperty("F_CaseTask", "OPCB_Location").setValue(taskUser.displayName);
        
            taskEditable.save(function(){
                currentCase.addTaskComment(205, infoMessage, taskEditable.id, null, null, true);
            },
            function(e) {
                console.log("Error on Submission " + params.TeamCode, e);
            }, true);
        }

    }

    
});



