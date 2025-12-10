var self = this;
var coord = payload.coordination;
var mySol = this.solution;

//var currentUser;
require(["icm/model/properties/controller/ControllerManager", "icm/base/Constants", "icm/util/Coordination", "icm/util/WorkItemHandler", "ecm/externalJS/CustomControls", "ecm/externalJS/jquery.min", "ecm/externalJS/bootstrap4.bundle.min.js",
	"ecm/externalJS/bootstrap-select.min.js"],
function(ControllerManager,Constants, Coordination, WorkItemHandler, CustomControls)
{
	var jq = $;
	self.caseEdt = payload.caseEditable;
	var userName = ecm.model.desktop.userId;
	var customControls = new CustomControls();
	
	coord.participate(Constants.CoordTopic.BEFORELOADWIDGET, function(context, complete, abort)
    {
    	var curYear = new Date().getFullYear();
    	for (var i=curYear; i < curYear + 10; i++) {
        	jq('#ddlBSCYear').append(jq('<option>', {
			    value: i,
			    text: i
			}));
        }
        
        jq("#ddlBSCYear").selectpicker({
    		header: "Select a Year",
    		style: "",
	        styleBase: "form-control",
	        container: "body"
    	});
    	
    	jq("#ddlBSCYear").selectpicker('val', curYear);
    	
    	complete();
    });
    
	coord.participate(Constants.CoordTopic.BEFORESAVE, function(context, complete, abort)
    {
    	//var ProcessType = self.caseEdt.getProperty("F_CaseFolder", "PURCH_PROCESSTYPE").value;
    	var category = "BSC";
    	var year = jq("#ddlBSCYear").selectpicker('val');
    	
    	if(year !== "") {
    		var  message = "You are about to submit the request to initiate BSC process for the Year " + year + ". Please confirm if you want to proceed";
            customControls.confirmMessage(message, function(response){
				if(response === "Yes"){
			        var propsController = ControllerManager.bind(self.caseEdt);
					propsController.beginChangeSet();
					
					propsController.getPropertyController("KGOC_InitiatorName").set("value", userName);
					propsController.getPropertyController("PMT_KPMCategory").set("value", category);
					propsController.getPropertyController("PMT_KPMYear").set("value", year);
					propsController.getPropertyController("PMT_InfoMessage").set("value", "Please select the groups & attach files before proceeding");
					
					propsController.endChangeSet();
					ControllerManager.unbind(self.caseEdt);
					
			        complete();
				}
				else {
					abort({silent:true});
				}
			});
		}
		else {
        	abort({ "message": "Please select the Year to continue" });
        }
	});
	
	coord.participate(Constants.CoordTopic.AFTERSAVE, function(context, complete, abort)
    {
        var currentCase = self.caseEdt.getCase();
		self.checkCount = 0;          
		self.statusChecker = setInterval(function(){              
			self.caseEdt.retrieveAttributes(function(){                  
				self.checkCount++;                  
				var caseState = self.caseEdt.caseObject.attributes["CmAcmCaseState"];     
				if(caseState === 2){                      
					clearInterval(self.statusChecker);                      
					delete self.statusChecker;                     

					var retrieveWorkItem = function(task) {
                    
						var workItemHdlr = new WorkItemHandler(self);
						mySol.retrieveWorkItem("PMT_SeniorPlanningEngineerPlanningEngineer", task.processInstanceId,  function(workItem){
							console.log("new workItem", workItem);
							workItemHdlr.handleWorkItem(workItem);
							setTimeout(complete, 2000);
						});
					};
					
					var taskSearchCallback = function(tasks){
						console.log("tasks", tasks);
						retrieveWorkItem(tasks[0]);
					};
					
					var taskTypes="";
				    var properties=[];
				    var propertyFilter="([TaskState] = 4 AND [CmAcmTaskName] = 'Balance Scorecard')";  
				    var resultsDisplay={};
				    var includeHidden= false;
				    
				    currentCase.searchTasks(taskTypes,properties,propertyFilter,resultsDisplay,includeHidden, dojo.hitch(this, taskSearchCallback));
				}                  
				if(self.checkCount > 5){                      
					clearInterval(self.statusChecker);                      
					delete self.statusChecker;  
					abort({silent:true});
				}              
			});          
		}, 1000); 
    });
	
});