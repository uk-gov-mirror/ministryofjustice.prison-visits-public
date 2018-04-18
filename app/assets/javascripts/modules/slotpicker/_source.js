(function() {
  'use strict';

  moj.Modules.Slotpicker = moj.Modules.Slotpicker || {}

  moj.Modules.Slotpicker.SlotSource = {

    el: '.js-calendar',

    init: function() {
      if ($(this.el) && $(this.el).length > 0) {
        this.cacheEls();
      }
    },

    cacheEls: function() {
      this.$el = $(this.el);
      this.$slotSource = $('#' + this.$el.data('slotSource'));
    },

    getSlotInformation: function() {
      return this.$slotSource.first().find('option').map(function() {
        var v = $(this).val();
        if (v !== '') {
          return $(this);
        }
      }).get();
    },

    getAvailableSlots: function() {
      var slots = this.getSlotInformation(),
        availableSlots = [], times = [],statuses = [], chosenArr = [],
        day, previous, dayIndex;

      for (var i = 0; i < slots.length; i++) {
        var slot = slots[i].val(),
          message = slots[i].data('message') || '',
          chosen = slots[i].data('slot-chosen') || false,
          originalAvailability = slots[i].attr('disabled') ? 0 : (chosen) ? 0 : 1,
          active = slots[i].is(':selected');

        day = moj.Modules.Slotpicker.Helpers.splitDateAndSlot(slot)[0];

        // Check if this is a new date in the array and push into days
        // If not a new day then just push the timeslot
        if (previous !== day) {
          times = [], statuses = [], chosenArr = [];
          dayIndex = availableSlots.push({
            'date': day,
            'timeslots': times,
            'availability': null
          }) - 1;
        } else {
          dayIndex = dayIndex;
        }
        times.push({
          'day': day,
          'time': moj.Modules.Slotpicker.Helpers.splitDateAndSlot(slot)[1],
          'slot': slot,
          'available': originalAvailability,
          'message': message,
          'chosen': chosen,
          'selected': active
        });
        $.each(times, function(i, obj) {
          statuses.push(obj.available);
          chosenArr.push(obj.chosen);
        });
        availableSlots[dayIndex]['availability'] = this.uniqueArray(statuses) ? 1 : statuses[0];
        availableSlots[dayIndex]['chosen'] = this.uniqueArray(chosenArr) ? true : chosenArr[0];

        previous = day;
      }
      return availableSlots;
    },

    uniqueArray: function(arr) {
      return moj.Modules.Slotpicker.Helpers.getUnique(arr).length > 1;
    },

    getValue: function() {
      return this.$slotSource.val();
    },

    setValue: function(slot) {
      this.$slotSource.val(slot);
    },

    removeSlot: function() {
      this.$slotSource.val(null);
    }

  }

}());
