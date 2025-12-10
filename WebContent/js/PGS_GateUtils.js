define([
  "icm/base/Constants",
  "ecm/externalJS/CustomControls",
  'ecm/externalJS/PGS/js/PGS_ChecklistUtils',
  "ecm/externalJS/CustomJS",
  'ecm/externalJS/PGS/js/PGS_CommitteeUtils',
], function (Constants, CustomControls, 
  ChecklistUtils,KGOCCustomJS, CommitteeUtils) {


  function CloseGateEvents(wiEditable,currentStages, response) {
    try {      
      var currentCase = wiEditable.getCase();
      var ControllingTeam = wiEditable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam')?.value || ''
      const stageNum = currentStages;
      if(stageNum === 2 || response === "Skip to Stage 4"){
        currentCase.createNewTaskEditable(
          "OPCB_ReviewStage",
          function (taskEditable) {
            CommitteeUtils.prcReviewStageCallBack(wiEditable, ControllingTeam, taskEditable);
          },
          function () {
            console.log("Failed creating task for " + team.TeamCode);
          },
          false
        );
      }   
    } catch (e) {
      console.error("Error in logCloseAction:", e);
    }
  }

  function handleResponseConfirmation(wiEditable, propsController, context, actionsMap, complete, abort) {
    var response = context[Constants.CoordContext.WKITEMRESPONSE];
    var customControls = new CustomControls();
    var customJS = new KGOCCustomJS();
    var currentCase = wiEditable.getCase();
    var currentStage = wiEditable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || '';
    const stageNum = currentStage.replace(/\D/g, '');
    if(response === "Submit"){
      var resultChecklist = ChecklistUtils.validateChecklistGrid(wiEditable, 'Checklist');
      if (!resultChecklist.isValid) {
        return abort({ message: resultChecklist.message });
      }
      if (["2","3", "4", "5"].includes(stageNum)) {      
        var resultChecklist = ChecklistUtils.validateChecklistGrid(wiEditable, 'Deliverables');
        if (!resultChecklist.isValid) {
          return abort({ message: resultChecklist.message });
        }
      }
    }


    if (response === "Return" || response === "Submit") {

      var dialogTitle = response === "Return" ? "Return Reason" : "Additional Submission Notes";
      var promptMessage = response === "Return"
        ? "Please enter the reason for returning the case and confirm to proceed"
        : "Optionally, you may provide additional notes for submission";

      customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
        var infoMessage;
        if (response === "Return" && res.isReturned) {
          infoMessage = "Returned by " + ecm.model.desktop.userDisplayName + ": " + res.returnReason;
          var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
          if (ctrl) ctrl.set("value", infoMessage);
          actionsMap["Return"](true);
        } else if (response === "Submit" && res.isReturned) {
            infoMessage = "Submitted by " + ecm.model.desktop.userDisplayName +
            (res.returnReason ? ": " + res.returnReason : "");
          
          var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
          
          if (ctrl) ctrl.set("value", infoMessage);
          actionsMap["Submit"](true);
        } else {
          actionsMap[response](false);
        }
      }, response === "Return", response === "Return" ? "Please enter the reason" : "Optional");
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
    } else if (response === "Send for Review") {
      var dialogTitle = "Submit for Review";      
      var promptMessage = "Would you like to submit this for review ? You’ll be able to track its progress afterward.";
      customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
        var infoMessage;
        if (response === "Send for Review") {
          infoMessage = "Submitted for PRC Committee Review and Consolidation by ." + ecm.model.desktop.userDisplayName +
            (res.returnReason ? ": " + res.returnReason : "");
          var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
          if (ctrl) ctrl.set("value", infoMessage);
          var ReviewCommittee = CommitteeUtils.getPRCCommittee();

          var cmitectrl = propsController.getPropertyController("OPCB_PRCCommittee");
          if (cmitectrl) cmitectrl.set("value", ReviewCommittee );


          console.log(ReviewCommittee);
          // taskEditable.getProperty("F_CaseTask", "OPCB_PRCCommittee").setValue([]);
          console.log(ReviewCommittee);
          ReviewCommittee.forEach(function (team) {
            currentCase.createNewTaskEditable(
              "OPCB_ReviewDSP",
              function (taskEditable) {
                CommitteeUtils.prcReviewCallBack(wiEditable, team, taskEditable,currentStage);
              },
              function () {
                console.log("Failed creating task for " + team.TeamCode);
              },
              false
            );
            
          });
          actionsMap["Send for Review"](true);

        } else {
          actionsMap[response](false);
        }
      });
    } else if (response === "Submit to PRC Committee") {
      var dialogTitle = "Submit for Review";
      var promptMessage = "Comments Sending to PRC Committee:";
      customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
        var infoMessage;
        if (response === "Submit to PRC Committee") {
          infoMessage = "Submitted for PRC Committee Review and Consolidation by ." + ecm.model.desktop.userDisplayName +
            (res.returnReason ? ": " + res.returnReason : "");
          var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
          if (ctrl) ctrl.set("value", infoMessage);
          var ReviewCommittee = CommitteeUtils.getPRCCommittee();

          var cmitectrl = propsController.getPropertyController("OPCB_PRCCommittee");
          if (cmitectrl) cmitectrl.set("value", ReviewCommittee );


          console.log(ReviewCommittee);
          // taskEditable.getProperty("F_CaseTask", "OPCB_PRCCommittee").setValue([]);
          console.log(ReviewCommittee);
          ReviewCommittee.forEach(function (team) {
            currentCase.createNewTaskEditable(
              "OPCB_ReviewDSP",
              function (taskEditable) {
                CommitteeUtils.prcReviewCallBack(wiEditable, team, taskEditable, currentStage);
              },
              function () {
                console.log("Failed creating task for " + team.TeamCode);
              },
              false
            );
            
          });
          actionsMap["Submit to PRC Committee"](true);

        } else {
          actionsMap[response](false);
        }
      });
    } else if (response === "Skip to Stage 4") {
      var dialogTitle = "Confirm Skip.";
      var promptMessage = "Are You Sure you want to skip gate : 1, 2 & 3 ? Once a gate's are skipped, it will be considered closed and cannot be reopened. ";
      customControls.returnDialogBox(dialogTitle, promptMessage, function (res) {
        var infoMessage;
        if (response === "Skip to Stage 4") {
          infoMessage = "Gate 1, 2 & 3 are skipped by." + ecm.model.desktop.userDisplayName +
            (res.returnReason ? ": " + res.returnReason : "");
          var ctrl = propsController.getPropertyController("OPCB_InfoMessage");
          if (ctrl) ctrl.set("value", infoMessage);

          actionsMap["Skip to Stage 4"](true);

        } else {
          actionsMap[response](false);
        }
      });
    }
    else {
      var messages = {
        "Cancel": "Cancelled by " + ecm.model.desktop.userDisplayName,
        "Approve": "Approved by " + ecm.model.desktop.userDisplayName,
        "Stop": "Stopped by " + ecm.model.desktop.userDisplayName + ". This case must be restarted from scratch.",
        "Forward": "Forwarded by " + ecm.model.desktop.userDisplayName + ". for review and updating values.",
        "Send for Review": "Forwarded by " + ecm.model.desktop.userDisplayName + ". for Committee review.",
        "Skip to Stage 4": "Skkiped by " + ecm.model.desktop.userDisplayName,
        "Submit to PRC Committee": "Forwarded by " + ecm.model.desktop.userDisplayName + ". for Committee review."
      };

      var confirmTexts = {
        "Submit": "The case will be submitted for further processing. Would you like to proceed?",
        "Send for Review": "The case will be submitted for PRC Committee. Would you like to proceed?",
        "Skip to Stage 4": "Are You Sure you want to skip gate : 1, 2 & 3 ? Once a gate's are skipped, it will be considered closed and cannot be reopened.",
        "Submit to PRC Committee": "The case will be submitted for PRC Committee. Would you like to proceed?",
        "Cancel": "This case will be cancelled and no further action will be possible. Are you sure you want to continue?",
        // "Approve": "Do you want to approve and proceed to the next gate? Once a gate is approved, it will be considered closed and cannot be reopened.",
        "Approve": {
          default: "Do you want to approve and proceed to the next gate? Once a gate is approved, it will be considered closed and cannot be reopened.",
          6: "This is the final gate. Once approved, the project will be closed and cannot be reopened. Do you want to proceed?"
        },  
        "Stop": "This action will permanently terminate the case. To continue, the case must be initiated again from the beginning. Do you want to proceed?",
      };

      let msg;

      if (response === "Approve") {
        msg = confirmTexts.Approve[stageNum] || confirmTexts.Approve.default;
      } else {
        msg = confirmTexts[response];
      }
      // var msg = confirmTexts[response][stageNum];
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
    console.log(response);
    console.log("response");
   const VerifyDSPDocument = [
        'Controlling Team Leader',
        'Controlling Team Representative',
      ].includes(ecm.model.desktop.currentRole.auth_name) &&
      !["Forward", undefined].includes(response);

      const proceed = () => {
        console.log("Proceeding with Gate Approval Logic");

        let stepName = wiEditable.getStepName();
        const currentStage = wiEditable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || '';
        const stageNum = currentStage.replace(/\D/g, '');

        if (["1","2","3", "4", "5", "6", "7"].includes(stageNum)) {
          stepName = `Approve Gate ${stageNum}`;
        } else {
          console.log("stageNum is not in the allowed range (3–7).");
        }

        const gateMatch = stepName ? stepName.match(/^Approve Gate (\d)$/) : null;

        handleResponseConfirmation(wiEditable, propsController, context, {
          Approve(confirmed) {
            if (!confirmed) return abort({ silent: true });
            if (gateMatch) {
              const currentGateNum = parseInt(gateMatch[1], 10);
              CloseGateEvents(wiEditable, currentGateNum);
              const nextStage = "Gate " + (currentGateNum + 1);
              const ctrl = propsController.getPropertyController("OPCB_CurrentStage");
              if (ctrl) ctrl.set("value", nextStage);
            }
            complete();
          },          
          "Skip to Stage 4"(confirmed) {

            
          console.log("sadsad");
              const currentGateNum = parseInt(gateMatch[1], 10);
            
          console.log(currentGateNum);
            if (!confirmed) return abort({ silent: true });
            
              const ctrl = propsController.getPropertyController("OPCB_CurrentStage");
              if (ctrl) ctrl.set("value", "Gate 4");
              CloseGateEvents(wiEditable, currentGateNum, "Skip to Stage 4");
            console.log("DODOBA");
            complete();
          },


          Submit: confirmed => (confirmed ? complete() : abort({ silent: true })),
          Return: confirmed => (confirmed ? complete() : abort({ silent: true })),
          Cancel: confirmed => (confirmed ? complete() : abort({ silent: true })),
          "Send for Review": confirmed => (confirmed ? complete() : abort({ silent: true })),
          "Submit to PRC Committee": confirmed => (confirmed ? complete() : abort({ silent: true })),
          Stop: confirmed => (confirmed ? complete() : abort({ silent: true })),
          Forward: confirmed => (confirmed ? complete() : abort({ silent: true }))
        }, complete, abort);
      };

      // Check for required DSP documents only for relevant roles
      if (VerifyDSPDocument) {
        const mandatoryDocs = ["OPCB_DecisionSupportPackage"];
        const docNames = ["Decision Support Package"];

        const caseObject = wiEditable.getCase();
        const currentStage = wiEditable.getProperty("F_CaseFolder", "OPCB_CurrentStage")?.value?.trim();

        if (!currentStage) {
          return abort({ message: "Current stage is missing. Cannot verify required documents." });
        }

        caseObject.retrieveCaseFolder(function (caseFolder) {
          caseFolder.retrieveFolderContents(false, function (contents) {
            const stageFolder = contents.items.find(item =>
              item.mimetype === "folder" && item.name === currentStage
            );

            if (!stageFolder) {
              return abort({ message: `Folder for stage '${currentStage}' not found.` });
            }

            stageFolder.retrieveFolderContents(false, function (stageContents) {
              for (let i = 0; i < stageContents.items.length; i++) {
                const item = stageContents.items[i];
                const docIndex = mandatoryDocs.indexOf(item.template);
                if (docIndex >= 0) {
                  mandatoryDocs.splice(docIndex, 1);
                  docNames.splice(docIndex, 1);
                }
              }

              if (mandatoryDocs.length > 0) {
                return abort({
                  message: "Please attach the following documents in the current stage folder before proceeding:<br/>" +
                    docNames.join("<br/>")
                });
              }

              // ✅ All documents found — now proceed
              proceed();
            });
          });
        });

      } else {
        // No document check needed
        proceed();
      }
    }
  };

});
