define([
  'aui',
  'jquery',
  'on-ready',
  'utils/loading'
], function (
  AJS,
  $,
  onReady
) {

  return onReady(function () {
    var
      dialogContentsDeferred,
      dialog;

    function createDialog($trigger) {
      var d = new AJS.Dialog({
        width: 600,
        height: 'auto',
        id: 'create-branch-dialog',
        closeOnOutsideClick: true
      });

      d.addHeader(gettext('Create branch'));
      d.addPanel('panel-create');
      d.addButton(gettext('Create'), function() {
        var $el = $(dialog.popup.element);
        $el.find('.dialog-button-panel button').loading();
        $el.find('#create-branch-form').submit();
      }, 'aui-button');
      d.addCancel(gettext('Cancel'), function(dialog) {
        dialog.hide();
      });

      dialogContentsDeferred = $.ajax({
        type: 'get',
        url: $trigger.attr('href'),
        dataType: 'html'
      });

      return d;
    }

    function showDialog(e) {
      var $trigger = $(e.target).closest('.create-branch-button');
      e.preventDefault();

      dialog = dialog || createDialog($trigger);

      $trigger.loading(dialogContentsDeferred).done(function(html) {
        var $html = $(html);
        $html.find('.buttons').remove();
        dialog.getCurrentPanel().body.html($html);
        require(['branches/create'], function (module) {
          module.onReady();
        });
      }).fail(function() {
        $(dialog.getCurrentPanel().body)
          .append('<p class="error">An unexpected error occurred.</p>');
      }).always(function () {
        dialog.show();
      });
    }

    // Use delegation to make sure it works in sidebar flyout
    $(document).on('click', '.create-branch-button', showDialog);
  });

});
