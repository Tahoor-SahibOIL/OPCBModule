define([
	"dojo/_base/declare",

  ], function (declare) {
  
	return declare("PGS", null, {
  
	  initializeAddCase: function (payload) {
		require(["ecm/externalJS/PGS/js/PGS_AddCase"], function (initFn) {
		  initFn(payload, this);
		}.bind(this));
	  },
  
	  initializeWorkDetails: function (payload) {
		require(["ecm/externalJS/PGS/js/PGS_WorkDetails"], function (initFn) {
		  initFn(payload, this);
		}.bind(this));
	  }
	  ,
  
	  initializeCommitteeReview: function (payload) {
		require(["ecm/externalJS/PGS/js/PGS_CommitteeReview"], function (initFn) {
		  initFn(payload, this);
		}.bind(this));
	  }
	  ,
  
	  initializeCaseDetails: function (payload) {
		require(["ecm/externalJS/PGS/js/PGS_CaseDetails"], function (initFn) {
		  initFn(payload, this);
		}.bind(this));
	  }
	});
  });
  