define([
  "icm/base/Constants",
  "ecm/externalJS/CustomControls",
  "ecm/externalJS/CustomJS",
  'ecm/externalJS/PGS/js/PGS_CommitteeUtils',
], function (Constants, CustomControls, KGOCCustomJS, CommitteeUtils) {


  function CloseReviewEvent(wiEditable) {
    try {
      var newComment = document.getElementById("txtComments_"+wiEditable.id);

            console.log(window.KGOCTeams);
    var currentStage =
      wiEditable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || ''
    var stageNum = currentStage.replace(/\D/g, '')
      var currentDeptCode = wiEditable.getProperty("F_CaseTask", "OPCB_DepartmentCode").value;
	    var reviewTeamCodes = [];
	    var reviewComments = [];
	    var submissionDates = [];
	    	reviewComments = reviewComments.concat(wiEditable.getProperty("F_CaseTask", "OPCB_Comments").value);
        submissionDates = submissionDates.concat(wiEditable.getProperty("F_CaseTask", "OPCB_SubmissionDateNew").value);
        reviewTeamCodes.push(currentDeptCode);
        reviewComments.push(newComment.value);
        submissionDates.push(new Date());
      
        wiEditable.getProperty("F_CaseTask", "OPCB_Comments").setValue(reviewComments);
        wiEditable.getProperty("F_CaseTask", "OPCB_SubmissionDateNew").setValue(submissionDates);
        wiEditable.getProperty("F_CaseTask", "OPCB_InfoMessage").setValue(currentDeptCode + " submitted the comments / recommendation");
        wiEditable.getProperty("F_CaseTask", "CurrentStatus").setValue("Completed");
        wiEditable.getProperty("F_CaseTask", "CurrentLocation").setValue("");
   
    } catch (e) {
      console.error("Error in logCloseAction:", e);
    }
  }

  function handleResponseConfirmation(wiEditable, propsController, context, actionsMap, complete, abort) {
    var response = context[Constants.CoordContext.WKITEMRESPONSE];
    var customControls = new CustomControls();
    var customJS = new KGOCCustomJS();

    if (response === "Return") {
        var dialogTitle = "Return Reason";
        var promptMessage = "Please enter the reason for returning the case and confirm to proceed";

        customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
            if (res.isReturned) {
            var infoMessage = "Returned by " + ecm.model.desktop.userDisplayName + ": " + res.returnReason;
            var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
            if (ctrl) ctrl.set("value", infoMessage);
            actionsMap["Return"](true);
            } else {
            actionsMap["Return"](false);
            }
        }, true, "Please enter the reason");

    } else if (response === "Submit") {
        var dialogTitle = "Additional Submission Notes";
        var promptMessage = "Optionally, you may provide additional notes for submission";

        customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
            if (res.isReturned) {
            var infoMessage = "Submitted by " + ecm.model.desktop.userDisplayName +
                (res.returnReason ? ": " + res.returnReason : "");

            var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
            if (ctrl) ctrl.set("value", infoMessage);
                CloseReviewEvent(wiEditable);
            actionsMap["Submit"](true);
            } else {
            actionsMap["Submit"](false);
            }
        }, false, "Optional");
    } else if (response === "Forward") {
      var ownerTeamCode = wiEditable.getProperty("F_CaseFolder", "OPCB_ControllingTeam").value;
      var assignees = customJS.getMembersByDepartment(ownerTeamCode);
      customControls.returnToAssigneeDialogBox(
        "Forward",
        "Please select the assignee",
        assignees,
        function (res) {
          if (res.isAssigned) {
            var selAssignee = Array.isArray(res.selectedAssignees) ? res.selectedAssignees[0] : res.selectedAssignees;
            console.log("Selected assignee:", selAssignee);
            
	          var currentRole = ecm.model.desktop.currentRole.auth_name;
            console.log(currentRole);
            // Get user display name (optional if used for message)
            var userInfo = assignees.find(function (x) {
              return x.value.toLowerCase() === selAssignee.toLowerCase();
            });

            var infoMessage = "Forwarded by " + ecm.model.desktop.userDisplayName +
              (res.replyMessage ? " Message: " + res.replyMessage : "");

            var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
            if (ctrl) ctrl.set("value", infoMessage);

            var taskUser = customJS.getWorkflowUser(wiEditable.repository.id, selAssignee.toLowerCase());
             
            actionsMap["Forward"](true);
          } else {
            actionsMap[response](false);
          }
        }
      );
    } else if(response === "Consolidate"){
        var dialogTitle = "Consolidation Statement";
        var promptMessage = "Optionally, you may provide additional notes for submission";

        customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
            if (res.isReturned) {
            var infoMessage = "Consolidated by " + ecm.model.desktop.userDisplayName +
                (res.returnReason ? ": " + res.returnReason : "");

            var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
            if (ctrl) ctrl.set("value", infoMessage);
                CloseReviewEvent(wiEditable);
            actionsMap["Consolidate"](true);
            } else {
            actionsMap["Consolidate"](false);
            }
        }, false, "Optional");
    } else {
      var messages = {
        "Cancel": "Cancelled by " + ecm.model.desktop.userDisplayName,
        "Approve": "Approved by " + ecm.model.desktop.userDisplayName,
        "Stop": "Stopped by " + ecm.model.desktop.userDisplayName + ". This case must be restarted from scratch.",
        "Forward": "Forwarded by " + ecm.model.desktop.userDisplayName + ". for review and updating values.",
        "Consolidate": "Consolidated by " + ecm.model.desktop.userDisplayName + "."
      };
      
      var confirmTexts = {
        "Submit": "The case will be submitted for further processing. Would you like to proceed?",
        "Cancel": "This case will be cancelled and no further action will be possible. Are you sure you want to continue?",
        "Approve": "Do you want to approve and proceed to the next gate? Once a gate is approved, it will be considered closed and cannot be reopened.",      
        "Stop": "This action will permanently terminate the case. To continue, the case must be initiated again from the beginning. Do you want to proceed?",
        "Consolidate": "This action will consolidate the committee comments. Do you want to proceed?",
      };

      var msg = confirmTexts[response];
      var actionCallback = actionsMap[response];

      if (msg && typeof actionCallback === "function") {
        customControls.confirmMessage(msg, function (userResponse) {
          if (userResponse === "Yes") {
            var infoMsg = messages[response];
            var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
            if (ctrl && infoMsg) ctrl.set("value", infoMsg);
            actionCallback(true);
          }
          else if (response === "Forward") {
            actionCallback(true);
          } else {
            actionCallback(false);
          }
        });
      } else if (typeof actionCallback === "function") {
        actionCallback(true);
      }
    }
  }

return {
  advanceGateIfApproved: function (wiEditable, context, propsController, complete, abort) {
    const response = context[Constants.CoordContext.WKITEMRESPONSE];
        handleResponseConfirmation(wiEditable, propsController, context, {        
          Submit: confirmed => (confirmed ? complete() : abort({ silent: true })),
          "Consolidate": confirmed => (confirmed ? complete() : abort({ silent: true })),
          Return: confirmed => (confirmed ? complete() : abort({ silent: true })),
          Cancel: confirmed => (confirmed ? complete() : abort({ silent: true })),
          Stop: confirmed => (confirmed ? complete() : abort({ silent: true })),
          Forward: confirmed => (confirmed ? complete() : abort({ silent: true }))
        }, complete, abort);
     
    }
  };

});
