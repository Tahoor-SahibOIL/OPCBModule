define([
  'icm/model/properties/controller/ControllerManager',
  'icm/base/Constants',
  'ecm/externalJS/PGS/js/PGS_UserUtils',
  'ecm/externalJS/PGS/js/PGS_HTMLLoader',
  'dojo/domReady!'
], function (ControllerManager, Constants, UserUtils, HTMLLoader) {

  return function (payload) {

     HTMLLoader.load(
      '/navigator/ecm/externalJS/PGS/html/PGS_AddCase.html?v=1.0.0',
      'addPGS'
    )

    var coord = payload.coordination;

    caseEdt = payload.caseEditable;
    var userName = ecm.model.desktop.userId;
    var userInfo = UserUtils.getCurrentUserTeam(userName, window.KGOCUsers);

    /*================================= BEFORESAVE =================================*/
    coord.participate(Constants.CoordTopic.BEFORESAVE, function (context, complete, abort) {
      var propsController = ControllerManager.bind(caseEdt);
      propsController.beginChangeSet();
;
      propsController.getPropertyController('OPCB_ControllingTeam').set('value', userInfo.team);
      propsController.getPropertyController('OPCB_InitiatorName').set('value', userInfo.name);
      propsController.getPropertyController('OPCB_RequestedBy').set('value', userInfo.name);
      propsController.getPropertyController('OPCB_InfoMessage').set('value', 'Fill all the mandatory details & attach files before proceeding');
      propsController.getPropertyController('OPCB_RaisedDate').set('value', new Date());

      var studyTitleInput = document.getElementById('txtStudyTitle');
      if (studyTitleInput) {
        propsController.getPropertyController('OPCB_StudyTitle').set('value', studyTitleInput.value);
      }
      propsController.getPropertyController('OPCB_CurrentStage').set('value', 'Gate 1');
      propsController.endChangeSet();

      complete();
    });

    /*================================= AFTERSAVE =================================*/

    /*AFTERSAVE is being handled in Case Builder Script Adapter (Add PGS Project Page)*/
  };
});
