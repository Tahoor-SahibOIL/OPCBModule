define([
    'icm/base/Constants',
    'icm/model/properties/controller/ControllerManager',
    "ecm/externalJS/CustomJS",
    "ecm/externalJS/CustomControls", 
    'ecm/externalJS/PGS/js/PGS_ChecklistUtils',
    'ecm/externalJS/PGS/js/PGS_ReviewUtils',
    'ecm/externalJS/PGS/js/PGS_HTMLLoader',
    'ecm/externalJS/PGS/js/PGS_CommitteeUtils',
    'dojo/store/Memory',
    'gridx/Grid',
	'gridx/core/model/cache/Sync', 
    "dojo/html",
    "ecm/externalJS/moment-with-locales.min",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style", 
	'dojo/on',
    'dojo/domReady!',
], function (
    Constants,
    ControllerManager,
    KGOCCustomJS,
    CustomControls,
    ChecklistUtils,
    ReviewUtils,
    HTMLLoader, CommitteeUtils, Store, Grid, Cache,html, moment,dom, domConstruct,domStyle,on
) {
    return function (payload) {
        var coord = payload.coordination
        var wiEditable = payload.workItemEditable
        var currentRole = ecm.model.desktop.currentRole.auth_name; // Get current role
        var currentStage = wiEditable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || ''
        var stageNum = currentStage.replace(/\D/g, '')
        var isEditable = [
            'Controlling Team Leader',
            'Controlling Team Representative',
        ].includes(currentRole)

        /*================================= BEFORELOADWIDGET ================================= */
        coord.participate(
            Constants.CoordTopic.BEFORELOADWIDGET,
            function (context, complete) {
                var observer = new MutationObserver(function () {
                    var controllingTeamEl = document.getElementById('controllingTeam')
                    if (!controllingTeamEl) return
                    observer.disconnect()
                    document.getElementById('infoMessage').textContent =
                        wiEditable.getProperty('F_CaseFolder', 'OPCB_InfoMessage')?.value || '';

                    document.getElementById('controllingTeam').value =
                        wiEditable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam')
                            ?.value || ''
                    document.getElementById('initiatorName').value =
                        wiEditable.getProperty('F_CaseFolder', 'OPCB_InitiatorName')
                            ?.value || ''
                    var raisedDate = wiEditable.getProperty(
                        'F_CaseFolder',
                        'OPCB_RaisedDate'
                    )?.value
                    document.getElementById('raisedDate').value = raisedDate
                        ? new Date(raisedDate).toLocaleDateString()
                        : ''
                    document.getElementById('studyTitle').value =
                        wiEditable.getProperty('F_CaseFolder', 'OPCB_StudyTitle')?.value ||
                        ''
                    document.getElementById('currentStage').value = currentStage

                    // Load Assessment Checklist Grid
                    ChecklistUtils.loadChecklistGrid(
                        wiEditable,
                        stageNum,
                        'Checklist',
                        isEditable
                    )

                    if (stageNum !== 1 && stageNum !== 6) {
                        ChecklistUtils.loadChecklistGrid(
                            wiEditable,
                            stageNum,
                            'Deliverables',
                            isEditable
                        );
                    } else {
                        console.log("Deliverables checklist not loaded for stage", stageNum);
                    }

                    var secretarySection = document.getElementById("prcSecretarySection");
                    var memberSection = document.getElementById("prcMemberSection");

                    if(currentRole === "PRC Secretary"){                        
                        bindTaskGrid(currentStage);
                        secretarySection.style.display = "block";
                        memberSection.style.display = "none";
                    } else if (currentRole === "PRC Member") {
                        bindTeamComments(); // Only load comments for Member
                        secretarySection.style.display = "none";
                        memberSection.style.display = "block";
                    }
                    complete();
                })

                var observeTarget = document.getElementById('reviewGate')
                if (observeTarget) {
                    observer.observe(observeTarget, { childList: true, subtree: true })
                } else {
                    complete()
                }
            }
        )

        /*================================= BEFORECOMPLETE ================================= */
        coord.participate(
            Constants.CoordTopic.BEFORECOMPLETE,
            function (context, complete, abort) {
                var propsController = ControllerManager.bind(wiEditable)                            
                const response = context[Constants.CoordContext.WKITEMRESPONSE];
                propsController.beginChangeSet()

                if(response === "Consolidate" && reviewPendingTeams.length > 0){
                    abort({ "message": "Review is still pending with some Teams (" + reviewPendingTeams.join(", ") + "). Please completes all the pending reviews to finalize the case."});                    
                    return;
                }
                ReviewUtils.advanceGateIfApproved(wiEditable, context, propsController, complete, abort);

                propsController.endChangeSet()

            }
        )


        coord.participate(Constants.CoordTopic.BEFORESAVE, function (context, complete, abort) {
            var propsController = ControllerManager.bind(wiEditable);
            propsController.beginChangeSet();
            ChecklistUtils.saveTeamComments(wiEditable, propsController); // <-- Save comment here

            propsController.endChangeSet();
            complete();
        });

    var customJS = new KGOCCustomJS();

        function renderCommentsHtml(teamCodes, comments, dates) {
            var commentsHtml = "";
            if (Array.isArray(teamCodes) && teamCodes.length > 0) {
                commentsHtml += "<div class='card border-0'><div class='card-body'><div class='list-group'>";
                for (var i = 0; i < teamCodes.length; i++) {
                    var teamCode = teamCodes[i];
                    var selTeam = window.KGOCTeams.find(function (x) {
                        return x.TeamCode === teamCode;
                    });
                    var teamName = selTeam ? selTeam.TeamName : teamCode;
                    var comment = comments[i] || "No comment";
                    var submittedOn = dates[i] ? moment(dates[i]).format("DD MMM YYYY h:mm a") : "";
                    commentsHtml += `
                <div class='list-group-item'>
                    <div class='d-flex w-100 justify-content-between'>
                        <h6 class='mb-1' style='color: #c80b0b;'>${teamName}</h6>
                        <small style='color: #c80b0b;'>${submittedOn}</small>
                    </div>
                    <p class='mb-1'><i class='bi bi-chat-square-text-fill' style='color: #c80b0b;'></i> ${comment}</p>
                </div>`;
                }
                commentsHtml += "</div></div></div>";
            } else {
                commentsHtml = `
            <div class='card m-3'>
                <div class='card-body'>
                    The submission is under review. No comments have been added yet.
                </div>
            </div>`;
            }

            return commentsHtml;
        }

    // === First Bind Function (for OPCB_ data) ===
    var bindTeamComments = function () {
        var uniqueId = wiEditable.id;
        var reviewTeamCodes = [].concat(wiEditable.getProperty("F_CaseTask", "OPCB_DepartmentCode").value || []);
        var reviewComments = [].concat(wiEditable.getProperty("F_CaseTask", "OPCB_Comments").value || []);


        var submissionDates = [].concat(wiEditable.getProperty("F_CaseTask", "OPCB_SubmissionDate").value || []);
        // === FIX: OPCB_AddComments is an array — safely get first value or fallback to empty string
        var newCommentArr = wiEditable.getProperty("F_CaseTask", "OPCB_AddComments").value || [];
        var newComment = Array.isArray(newCommentArr) && newCommentArr.length > 0 ? newCommentArr[0] : "";

        // === Step 1: Get <textarea id="txtComments"> element (static ID in HTML)
        var txtInput = document.getElementById("txtComments");

        if (txtInput) {
            // === Step 2: Change its ID to a unique one using work item ID
            var dynamicId = "txtComments_" + uniqueId;
            txtInput.id = dynamicId;

            // === Step 3: Re-fetch the renamed element and set the new comment value
            var renamedInput = document.getElementById(dynamicId);
            if (renamedInput) {
                renamedInput.value = newComment;
            } else {
                console.warn("⚠️ Failed to re-fetch input after renaming ID:", dynamicId);
            }
        } else {
            console.warn("❌ Element with ID 'txtComments' not found in DOM");
        }

        // === Step 4: Generate and insert comment history HTML (using your renderer)
        var html = renderCommentsHtml(reviewTeamCodes, reviewComments, submissionDates);

        var prcDiv = document.getElementById("lgComments");
        var rfpDiv = document.getElementById("targetDiv");

        if (prcDiv) prcDiv.innerHTML = html;
        if (rfpDiv) rfpDiv.innerHTML = html;
    };

    var bindTaskGrid = function () {
        var myCase = wiEditable.getCase();
        var taskTypes = "";
        var properties = [
            "OPCB_DepartmentCode", "OPCB_ActivityUser", "CurrentStatus",
            "OPCB_SubmissionDate", "OPCB_Comments", "OPCB_SubmissionDateNew"
        ];
        var propertyFilter = "([TaskState] in (4,5) AND [CmAcmTaskName] like 'PRC Committee Review - %') AND [Current Stage] like '"+currentStage+"'";
        var resultsDisplay = {};
        var includeHidden = false;

        myCase.searchTasks(
            taskTypes,
            properties,
            propertyFilter,
            resultsDisplay,
            includeHidden,
            dojo.hitch(this, taskSearchCallback)
        );
    };

    var taskSearchCallback = function (tasks) {

var currentRole = ecm.model.desktop.currentRole.auth_name;
        var targetTab = new dijit.layout.TabContainer({
            id: "targetTabPane_" + wiEditable.id,
            style: "height: 100%; width: 100%;",
            doLayout: false
        });
        reviewPendingTeams = [];
            var reviewData = [];
        for (var x = 0; x < tasks.length; x++) {
            var taskAttr = tasks[x].attributes;
            var prcCommittee = CommitteeUtils.getPRCCommittee();

            var taskTeam = prcCommittee.find(function (team) {
                return team.TeamCode === taskAttr.OPCB_DepartmentCode;
            });
            if (!taskTeam) {
                console.warn("No matching team found in PRC Committee for department code:", taskAttr.OPCB_DepartmentCode);
                continue; // or handle accordingly
            }


            if (taskAttr.CurrentStatus !== "Completed") {
                reviewPendingTeams.push(taskAttr.OPCB_DepartmentCode);
            }
            reviewData.push({
                id: x + 1,
                TeamCode: taskAttr.OPCB_DepartmentCode,
                TeamName: taskTeam.TeamName,
                Status: taskAttr.CurrentStatus,
                RequestedOn: moment(taskAttr.OPCB_SubmissionDate).format("DD MMM YYYY h:mm a"),
                Instance: {
                    InstanceId: tasks[x].processInstanceId,
                    TaskId: tasks[x].id,
                    TaskState: tasks[x].taskState,
                    TeamCode: taskAttr.OPCB_DepartmentCode,
                    ActivityUser: taskAttr.OPCB_ActivityUser,
                    TeamStatus: taskAttr.CurrentStatus,
                    GateStatus: taskAttr.currentStage,
                    CommentTeams: taskAttr.OPCB_PRCCommittee,
                    Comments: taskAttr.OPCB_Comments,
                    SubmissionDates: taskAttr.OPCB_SubmissionDateNew,
                    ReminderCount: 0
                }
            });
            var commentsHtml = "";
            var teamName = "";
            if (taskAttr.OPCB_Comments.length > 0) {
                commentsHtml += "<div class='card border-0'><div class='card-body'>";
                commentsHtml += "<div class='list-group'>";
                for (var i = 0; i < taskAttr.OPCB_Comments.length; i++) {
                    teamName = taskTeam.TeamName;
                    commentsHtml += "<div class='list-group-item'><div class='d-flex w-100 justify-content-between'>";
                    commentsHtml += "<h6 class='mb-1' style='color: #c80b0b;'>" + taskTeam.TeamName + "</h6>";
                    commentsHtml += "<small style='color: #c80b0b;'>" + moment(taskAttr.OPCB_SubmissionDateNew[i]).format("DD MMM YYYY h:mm a") + "</small>";
                    commentsHtml += "</div>";
                    commentsHtml += "<p class='mb-1'><i class='bi bi-chat-square-text-fill' style='color: #c80b0b;'> </i>" + taskAttr.OPCB_Comments[i] + "</p>";
                    commentsHtml += "</div>";
                }
                commentsHtml += "</div></div>";
            }
            else {
                commentsHtml += "<div class='card m-3'><div class='card-body'>Still under review with the " + taskTeam.TeamName + ".</div></div>";
            }
            var cp1 = new dijit.layout.ContentPane({
                title: taskAttr.OPCB_DepartmentCode,
                content: commentsHtml
            });
            targetTab.addChild(cp1);
            // cp1.content.startup();
        }

        targetTab.placeAt("CommitteetargetDiv");
        targetTab.startup();
        var store = new Store({ data: reviewData });
        var layout = [
            { name: 'Sl No.', field: 'id', width: '10%', style: 'font-weight: bold !important' },
            { name: 'Team Name', field: 'TeamName', style: 'font-weight: bold !important' },
            { name: 'Status', field: 'Status', width: '150px', style: 'font-weight: bold !important' },
            { name: 'Requested On', field: 'RequestedOn', width: '150px', style: 'font-weight: bold !important' },
            {
                name: 'Actions', field: 'Instance', width: '200px', widgetsInCell: true, navigable: true, allowEventBubble: true,
                decorator: function () {
                    return [
                        // '<button data-dojo-attach-point="btnReturn" title="Return for Review" class="btn pt-0 pb-0"><i class="bi bi-arrow-left-circle-fill" style="font-size: 24px; color: #be0015;"></i></button>',
                        '<button data-dojo-attach-point="btnReminder" title="Send Reminder" class="btn pt-0 pb-0 position-relative">Reminder</button>'
                    ].join('');
                },
                setCellValue: function (data, storeData, cellWidget) {
                    // domStyle.set(this.btnReturn, "display", (data.TeamStatus === "Completed" && data.TaskState === 4 ? "block" : "none"));
                    domStyle.set(this.btnReminder, "display", (data.TeamStatus !== "Completed" && data.TaskState === 4 ? "block" : "none"));
                    html.set(this.btnReminder, "<i class='bi bi-bell-fill' style='font-size: 24px; color: #be0015;'></i><span class='position-absolute translate-middle badge rounded-pill bg-secondary' style='top: 25%; left: 75%'>" + data.ReminderCount + "</span>");

                    // on(this.btnReturn, "click", dojo.hitch(this, returnForReviewCallback, data));
                    on(this.btnReminder, "click", dojo.hitch(this, sendReminderEmail, data));
                }
            }
        ];

        var grid = new Grid({
            id: "gridReview_" + wiEditable.id,
            cacheClass: Cache,
            store: store,
            structure: layout,
            autoHeight: true,
            modules: [
                "gridx/modules/CellWidget",
                "gridx/modules/Edit"
            ]
        });

        grid.placeAt("reviewTableGrid");
        grid.startup();
    };

    var customControls = new CustomControls();
        var returnForReviewCallback = function(param, evt) {
		var  introMessage = "Please enter the reason for requesting re-review and confirm to proceed";
		customControls.returnDialogBox("Return Message", introMessage, function(response){
			if(response.isReturned) {
				param.CommentTeams.push(ownerTeam.TeamCode);
				param.Comments.push(response.returnReason);
				param.SubmissionDates.push(new Date());
				var submissionDates = param.SubmissionDates.map(dt => moment(dt).format("MM/DD/yyyy HH:mm:ss"));
				
				var selTeam = window.KGOCTeams.filter(function(x){return x.TeamCode === param.TeamCode;});
				var tlInfo = window.KGOCUsers.filter(function(x){return x.value.toLowerCase() === selTeam[0].TeamLeader.toLowerCase();})[0];
				
	    		var requestData = {
		            instanceId: param.InstanceId,
		            roleName: "OPCB_Admin",
		            responseName: "Return",
		            properties: [
		            	{Key: "CurrentStatus", Value: "Re-Review Requested"},
		            	{Key: "OPCB_SubmissionDate", Value: moment(new Date()).format("MM/DD/yyyy HH:mm:ss")},
		            	{Key: "OPCB_AddComment", Value: ""},
		            	{Key: "APPR_ReviewingTeams", Value: param.CommentTeams},
		            	{Key: "OPCB_Comments", Value: param.Comments},
		            	{Key: "OPCB_SubmissionDateNew", Value: submissionDates},
		            	{Key: "OPCB_ReminderCount", Value: 0},
		            	{Key: "CurrentLocation", Value: tlInfo.name},
						{Key: "OPCB_ActivityUser", Value: selTeam[0].TeamLeader},
		            	{Key: "OPCB_InfoMessage", Value: "Returned by PRC Secretory Team Leader for re-review. Please check the 'Team Review Comments' section for more details."}
		            ],
		            workGroup: {
		            	IsWorkGroup: true,
		            	WorkGroupName: "CONCERNED_TEAM_LEADER",
		            	WorkGroupUsers: [selTeam[0].TeamLeader]
		            }
		        };
		        var retVal = customJS.processDiscretionaryTask(requestData);
		        if(retVal) {
		        	resetAllDynamicControls();
		        	bindTaskGrid();
		        	myCase.addTaskComment(205, "Returned by PRC Secretary for re-review.", param.TaskId, null, null, true);
		        	myCase.addCaseComment(101, "PRC Secretary requested " + param.TeamCode + " Team to re-review.", null, null, true);
		        }
			}
		}, true, "Please enter the reason");
    };

	var resetAllDynamicControls = function(){
		var reviewGrid = dijit.byId("gridReview_" + wiEditable.id);
    	var targetTabPane = dijit.byId("targetTabPane_" + wiEditable.id);
        reviewGrid.destroy();
        targetTabPane.destroy();
        reviewData = [];
    };



    
     var sendReminderEmail = function(param, evt) {
        
    var customJS = new KGOCCustomJS();
        var myCase = wiEditable.getCase();
    	customControls.confirmMessage("Please confirm if you want to send reminder to " + param.TeamCode, function(response){
			if(response === "Yes") {
				var rc = param.ReminderCount;
				rc = rc + 1;
				var infoMessage = "Reminder(" + rc + ") send to "  + param.TeamCode + " by " + ecm.model.desktop.userDisplayName + ".";
                var prcCommittee = CommitteeUtils.getPRCCommittee(); //use this to extract team
                
                // Find matching team from PRCCommittee
                var selTeam = prcCommittee.find(function(x) {
                    return x.TeamCode === param.TeamCode;
                });

                var selTL = selTeam ? selTeam.TeamLeader : "";
                var selPosition = selTeam ? selTeam.Position : "";

				// var selTLs = window.KGOCTeams.filter(function(x){return x.TeamCode === param.TeamCode;})[0].TeamLeader;
				var activityUser = param.ActivityUser.toLowerCase() !== selTL.toLowerCase() ? param.ActivityUser : "";
				// console.log("selTL",selTL);
                // console.log("activityUser",activityUser);
				var requestData = { rosterName: "OperationalPlanningandCapitalBudget", responseName: "Reminder",
					queryFilters: [
						{ Key: "F_WobNum", Value: param.InstanceId }
		            ]
                    ,
		            properties: [
						{ Key: "OPCB_ReminderCount", Value: rc }
		            ]
		        };
                console.log("sendReminderEmailrequestData",requestData)

		        var isSuccess = customJS.processRosterWorkItem(requestData);
                
                console.log("isSuccess",isSuccess)
			    if(!isSuccess){
			    	resetAllDynamicControls();
		        	bindTaskGrid();
					myCase.addTaskComment(205, infoMessage, param.TaskId, null, null, true);
					
					customJS.sendEmailForAction(wiEditable, "PGS_PRC_REVIEW", selTL, activityUser, ecm.model.desktop.id, wiEditable.repository.objectStoreName, "OPCB", "Inbox", infoMessage, param.InstanceId);
				}
			}
		}, false);
    };

    var SaveReviewData = function(newComment) {
	    var currentDeptCode = wiEditable.getProperty("F_CaseTask", "KGOC_DepartmentCode").value;
	    var reviewTeamCodes = [];
	    var reviewComments = [];
	    var submissionDates = [];
	    
	    reviewTeamCodes = reviewTeamCodes.concat(wiEditable.getProperty("F_CaseTask", "APPR_ReviewingTeams").value);
		reviewComments = reviewComments.concat(wiEditable.getProperty("F_CaseTask", "PURCH_comments").value);
        submissionDates = submissionDates.concat(wiEditable.getProperty("F_CaseTask", "APPR_SubmissionDateNew").value);
        
        reviewTeamCodes.push(currentDeptCode);
        reviewComments.push(newComment);
        submissionDates.push(new Date());
        
        wiEditable.getProperty("F_WorkflowField", "Reviewer_Attachment").setAttachments(self.page.ContentList394.contentItems);
        wiEditable.getProperty("F_CaseTask", "APPR_ReviewingTeams").setValue(reviewTeamCodes);
        wiEditable.getProperty("F_CaseTask", "PURCH_comments").setValue(reviewComments);
        wiEditable.getProperty("F_CaseTask", "APPR_SubmissionDateNew").setValue(submissionDates);
        wiEditable.getProperty("F_CaseTask", "KGOC_InfoMessage").setValue(currentDeptCode + " Team Leader submitted the comments / recommendation");
        wiEditable.getProperty("F_CaseTask", "CurrentStatus").setValue("Completed");
        wiEditable.getProperty("F_CaseTask", "CurrentLocation").setValue("");
	};

        HTMLLoader.load(
            '/navigator/ecm/externalJS/PGS/html/PGS_CommitteeReview.html?v=1.0.0',
            'reviewGate'
        )
    }
})