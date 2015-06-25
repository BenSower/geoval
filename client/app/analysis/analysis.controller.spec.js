'use strict';

describe('Controller: AnalysisCtrl', function () {

  // load the controller's module
  beforeEach(module('geovalApp'));

  var AnalysisCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AnalysisCtrl = $controller('AnalysisCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
