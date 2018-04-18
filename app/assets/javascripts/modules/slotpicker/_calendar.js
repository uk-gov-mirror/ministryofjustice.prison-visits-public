(function() {
  'use strict';

  moj.Modules.Slotpicker = moj.Modules.Slotpicker || {}

  var Calendar = function(el, options) {
    this._settings = $.extend({}, this.defaults, options);
    this.init = function() {
      this.cacheEls();
      this.bindEvents();
      this.setupGrid();
    };
    this.cacheEls = function() {
      this.$el = el;
      this.$grid = this.$el.find('#js-calendarTable');
      this.$tbody = this.$grid.find('tbody');
      this.$monthHeader = this.$el.find('#month');
      this.$prev = this.$el.find('#bn_prev');
      this.$next = this.$el.find('#bn_next');
    };
    return this;
  }

  Calendar.prototype = {

    defaults: {
      keys: {
        tab: 9,
        enter: 13,
        esc: 27,
        space: 32,
        pageup: 33,
        pagedown: 34,
        end: 35,
        home: 36,
        left: 37,
        up: 38,
        right: 39,
        down: 40
      }
    },

    bindEvents: function() {
      var self = this;

      // bind navigation handlers
      this.$prev.click(function(e) {
        return self.handleNavClick(e, 'prev');
      });

      this.$next.click(function(e) {
        return self.handleNavClick(e, 'next');
      });

      this.$prev.keydown(function(e) {
        return self.handleNavKeyDown(e, 'prev');
      });

      this.$next.keydown(function(e) {
        return self.handleNavKeyDown(e, 'next');
      });

      // bind grid handlers
      this.$grid.keydown(function(e) {
        return self.handleGridKeyDown(e);
      });

      this.$grid.keypress(function(e) {
        return self.handleGridKeyPress(e);
      });

      this.$grid.focus(function(e) {
        return self.handleGridFocus(e);
      });

      this.$grid.blur(function(e) {
        return self.handleGridBlur(e);
      });

      this.$grid.delegate('td', 'click', function(e) {
        return self.handleGridClick(this, e);
      });

    },

    setupGrid: function() {
      var numDays = moj.Modules.Slotpicker.Helpers.calcDaysInMonth(this._settings.year, this._settings.month),
          startWeekday = moj.Modules.Slotpicker.Helpers.calcStartWeekday(this._settings.year, this._settings.month),
          weekday = 0,
          rowCount = 1,
          gridCells = '\t<tr role="row" id="row0">\n';

      this.$monthHeader.html(this._settings.i18n.months[this._settings.month] + ' ' + this._settings.year);
      this.clearGrid();

      // Insert the leading empty cells
      for (weekday = 0; weekday < startWeekday; weekday++) {
        gridCells += this.createEmptyCell();
      }

      // insert the days of the month.
      for (var curDay = 1; curDay <= numDays; curDay++) {

        var className = 'disabled',
          ariaLabel = 'This date is unavailable',
          ariaSelected = '',
          readonly = true;

        var cellDate = this._settings.year + '-' + (this._settings.month <= 8 ? '0' : '') + (this._settings.month + 1) + '-' + (curDay <= 9 ? '0' : '') + curDay;

        for (var i = 0; i < this._settings.availableSlots.length; i++) {
          if (this._settings.availableSlots[i].date === cellDate) {
            className = (this._settings.availableSlots[i].availability === 1) ? 'available' : 'unavailable';
            readonly = (this._settings.availableSlots[i].availability === 1) ? false : true;
            className += (this._settings.availableSlots[i].chosen === true) ? ' chosen' : '';
            ariaLabel = '';
            ariaSelected = 'aria-selected="false"'
          }
        }

        if (cellDate === this._settings.selectedDate) {
          className += ' selected';
          ariaSelected = 'aria-selected="true"';
        }

        gridCells += '\t\t<td id="day' + curDay + '" class="' + className + '" role="gridcell">' +
          '<a ' + ariaSelected + ' aria-readonly="' + readonly + '" tabindex="-1" href="#" rel="nofollow" aria-label="' + curDay + ', ' + this._settings.i18n.days[weekday] + ' ' + this._settings.i18n.months[this._settings.month] +
          ' ' + this._settings.year + ' - ' + ariaLabel + '" class="cell-date no-link">' + curDay + '</a></td>';

        if (weekday == 6 && curDay < numDays) {
          // This was the last day of the week, close it out
          // and begin a new one
          gridCells += '\t</tr>\n\t<tr role="row" id="row' + rowCount + '">\n';
          rowCount++;
          weekday = 0;
        } else {
          weekday++;
        }
      }

      // Insert any trailing empty cells
      for (weekday; weekday < 7; weekday++) {
        gridCells += this.createEmptyCell();
      }

      gridCells += '\t</tr>';
      this.addRows(gridCells);
      this.setPrevBtn();
      this.setNextBtn();
    },

    clearGrid: function() {
      this.$tbody.empty();
      $('#msg').empty();
    },

    createEmptyCell: function() {
      return '\t\t<td class="empty">&nbsp;</td>\n';
    },

    addRows: function(html) {
      this.$tbody.append(html);
    },

    hideNavBtn: function(btn, attr) {
      btn.attr('aria-hidden', attr);
    },

    setPrevBtn: function() {
      var maxDate = moj.Modules.Slotpicker.Helpers.makeDateObj(this.findLastAvailableDay().date).getMonth();
      if(this._settings.month == 11 && maxDate == 0){
        this.hideNavBtn(this.$next, false);
      } else if(maxDate > this._settings.month) {
        this.hideNavBtn(this.$next, false);
      } else {
        this.hideNavBtn(this.$next, true);
      }
    },

    setNextBtn: function() {
      var minDate = moj.Modules.Slotpicker.Helpers.makeDateObj(this.findFirstAvailableDay().date).getMonth();
      if(this._settings.month == 0 && minDate == 11){
        this.hideNavBtn(this.$prev, false);
      } else if(minDate < this._settings.month) {
        this.hideNavBtn(this.$prev, false);
      } else {
        this.hideNavBtn(this.$prev, true);
      }
    },

    findLastAvailableDay: function() {
      return this._settings.availableSlots[this._settings.availableSlots.length - 1];
    },

    findFirstAvailableDay: function() {
      return this._settings.availableSlots[0];
    },

    showPrevMonth: function(offset) {
      if (this._settings.month == 0) {
        this._settings.month = 11;
        this._settings.year--;
      } else {
        this._settings.month--;
      }
      this.setMonth();
      // if offset was specified, set focus on the last day - specified offset
      if (offset != null) {
        var numDays = moj.Modules.Slotpicker.Helpers.calcDaysInMonth(this._settings.year, this._settings.month);
        var day = 'day' + (numDays - offset);
        this.setDayAttr(day);
      }
    },

    showNextMonth: function(offset) {
      if (this._settings.month == 11) {
        this._settings.month = 0;
        this._settings.year++;
      } else {
        this._settings.month++;
      }
      this.setMonth();
      // if offset was specified, set focus on the first day + specified offset
      if (offset != null) {
        var day = 'day' + offset;
        this.setDayAttr(day);
      }
    },

    setMonth: function() {
      this.setCurrentDate();
      this.setupGrid();
    },

    setDayAttr: function(day) {
      this.setActiveDescendant(day);
      this.addCellFocus($('#' + day));
    },

    setCurrentDate: function() {
      if (this._settings.month != this._settings.curMonth || this._settings.year != this._settings.curYear) {
        this._settings.currentDate = false;
      } else {
        this._settings.currentDate = true;
      }
    },

    handleNavClick: function(e, direction) {

      var active = this.getActiveDescendant();

      (direction == 'next')? this.showNextMonth() : this.showPrevMonth();

      if (this._settings.currentDate == false) {
        this.setActiveDescendant('day1');
      } else {
        this.setActiveDescendant(active);
      }

      e.stopPropagation();
      return false;
    },

    handleNavKeyDown: function(e, direction) {
      if (e.altKey) {
        return true;
      }
      switch (e.keyCode) {
        case this._settings.keys.tab: {
          if (e.shiftKey || e.ctrlKey) {
            return true;
          }
          this.$grid.focus();
          e.stopPropagation();
          return false;
        }
        case this._settings.keys.enter:
        case this._settings.keys.space: {
          (direction == 'next')? this.showNextMonth() : this.showPrevMonth();
          e.stopPropagation();
          return false;
        }

      }
    },

    handleGridFocus: function(e) {
      var active = this.getActiveDescendant();
      if (!active || active == 'month') {
        this.setFirstDayFocus();
      } else {
        this.addCellFocus($('#' + active));
      }

      return true;
    },

    handleGridBlur: function(e) {
      this.removeCellFocus($('#' + this.getActiveDescendant()));
      return true;
    },

    handleGridKeyDown: function(e) {
      var $rows = this.$grid.find('tbody tr');
      var $curDay = $('#' + this.getActiveDescendant());
      var $days = this.$grid.find('td').not('.empty');
      var $emptyDays = this.$grid.find('td').not('.empty, .disabled');
      var $curRow = $curDay.parent();

      if (e.altKey || e.ctrlKey || e.shiftKey) {
        return true;
      }

      this.removeCellFocus($curDay);

      switch (e.keyCode) {

        case this._settings.keys.enter:
        case this._settings.keys.space:
          {
            var dayIndex = $emptyDays.index($curDay);
            this.$grid.find('.selected').removeClass('focus selected').find('.cell-date').attr('aria-selected', 'false');
            $curDay.addClass('focus selected').find('.cell-date').attr('aria-selected', 'true');
            if (dayIndex >= 0) {
              this.updateSelected($curDay);
              this.sendAnalytics('Keydown', this._settings.availableMessage);
            } else {
              moj.Modules.Slotpicker.Helpers.conditionals(this._settings.slotList).html(this._settings.unavailableMessage);
              this.sendAnalytics('Keydown', this._settings.unavailableMessage);
              return false;
            }
          }
        case this._settings.keys.esc:
          {
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.left:
          {
            var dayIndex = $days.index($curDay) - 1;
            var $prevDay = null;
            if (dayIndex >= 0) {
              $prevDay = $days.eq(dayIndex);
              this.addCellFocus($prevDay);
              this.setActiveDescendant($prevDay.attr('id'));
            } else {
              this.showPrevMonth(0);
            }
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.right:
          {
            var dayIndex = $days.index($curDay) + 1;
            var $nextDay = null;
            if (dayIndex < $days.length) {
              $nextDay = $days.eq(dayIndex);
              this.addCellFocus($nextDay);
              this.setActiveDescendant($nextDay.attr('id'));
            } else {
              this.showNextMonth(1);
            }
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.up:
          {
            var dayIndex = $days.index($curDay) - 7;
            var $prevDay = null;
            if (dayIndex >= 0) {
              $prevDay = $days.eq(dayIndex);
              this.addCellFocus($prevDay);
              this.setActiveDescendant($prevDay.attr('id'));
            } else {
              // move to appropriate day in previous month
              dayIndex = 6 - $days.index($curDay);
              this.showPrevMonth(dayIndex);
            }
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.down:
          {
            var dayIndex = $days.index($curDay) + 7;
            var $prevDay = null;
            if (dayIndex < $days.length) {
              $prevDay = $days.eq(dayIndex);
              this.addCellFocus($prevDay);
              this.setActiveDescendant($prevDay.attr('id'));
            } else {
              // move to appropriate day in next month
              dayIndex = 8 - ($days.length - $days.index($curDay));
              this.showNextMonth(dayIndex);
            }
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.pageup:
          {
            var active = this.getActiveDescendant();
            this.showPrevMonth();
            if (!active || active == 'month') {
              var lastDay = 'day' + moj.Modules.Slotpicker.Helpers.calcDaysInMonth(this._settings.year, this._settings.month);
              this.addCellFocus($('#' + lastDay));
            } else {
              this.addCellFocus($('#' + active));
            }
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.pagedown:
          {
            var active = this.getActiveDescendant();
            this.showNextMonth();
            if (!active || active == 'month') {
              var lastDay = 'day' + moj.Modules.Slotpicker.Helpers.calcDaysInMonth(this._settings.year, this._settings.month);
              this.addCellFocus($('#' + lastDay));
            } else {
              this.addCellFocus($('#' + active));
            }
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.home:
          {
            this.setFirstDayFocus();
            e.stopPropagation();
            return false;
          }
        case this._settings.keys.end:
          {
            var lastDay = 'day' + moj.Modules.Slotpicker.Helpers.calcDaysInMonth(this._settings.year, this._settings.month);
            this.addCellFocus($('#' + lastDay));
            this.setActiveDescendant(lastDay);
            e.stopPropagation();
            return false;
          }
      }

      return true;
    },

    handleGridKeyPress: function(e) {

      if (e.altKey) {
        return true;
      }

      switch (e.keyCode) {
        case this.keys.enter:
        case this.keys.space:
        case this.keys.esc:
        case this.keys.left:
        case this.keys.right:
        case this.keys.up:
        case this.keys.down:
        case this.keys.pageup:
        case this.keys.pagedown:
        case this.keys.home:
        case this.keys.end:
          {
            e.stopPropagation();
            return false;
          }
      }

      return true;
    },

    handleGridClick: function(id, e) {
      var $cell = $(id);

      if ($cell.is('.empty')) {
        return true;
      }

      this.$grid.find('.focus, .selected').removeClass('focus selected').find('.cell-date').attr('aria-selected', 'false');
      $cell.addClass('focus selected').find('.cell-date').attr('aria-selected', 'true');
      this.setActiveDescendant($cell.attr('id'));

      if ($cell.is('.disabled')) {
        moj.Modules.Slotpicker.Helpers.conditionals(this._settings.slotList).html(this._settings.unavailableMessage);
        this.sendAnalytics('Click', this._settings.unavailableMessage);
        return true;
      }
      var $curDay = $('#' + this.getActiveDescendant());
      this.updateSelected($curDay);
      this.sendAnalytics('Click', this._settings.availableMessage);
      e.stopPropagation();
      return false;
    },

    setFirstDayFocus: function() {
      this.addCellFocus($('#day1'));
      this.setActiveDescendant('day1');
    },

    getActiveDescendant: function() {
      return this.$grid.attr('aria-activedescendant');
    },

    setActiveDescendant: function(val) {
      this.$grid.attr('aria-activedescendant', val);
    },

    addCellFocus: function($cell) {
      $cell.addClass('focus').find('.cell-date').attr('aria-selected', 'true');
    },

    removeCellFocus: function($cell) {
      $cell.removeClass('focus').find('.cell-date').attr('aria-selected', 'false');
    },

    updateSelected: function($curDay) {
      var date = this._settings.year + '-' + (this._settings.month < 9 ? '0' : '') + (this._settings.month + 1) + '-' + ($curDay.text() <= 9 ? '0' : '') + $curDay.text();
      this._settings.selectedDate = date;
      this.$el.trigger('updateSlotsList', date);
    },

    sendAnalytics: function(action, label) {
      moj.Modules.Analytics.send({
        'category': 'Calendar',
        'action': action,
        'label': label
      });
    }

  }

  moj.Modules.Slotpicker.Calendar = Calendar;

}());
