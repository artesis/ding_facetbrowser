(function($) {

  Drupal.behaviors.facetbrowser = {
    attach: function(context, settings) {
      Drupal.FoldFacetGroup();

      var main_element = $(Drupal.settings.dingFacetBrowser.mainElement);

      // Wrap all facet fieldsets marked as hidden in a container so we can hide
      // em. The link text is show less and will be changed to show more if the
      // cookie is false.
      var show_more = $('<a href="#" class="expand-facets expand-facets-visible">' + Drupal.t('Show less filters') + '</a>');
      main_element.find('fieldset.hidden').wrapAll('<div id="hidden-facets" class="hidden-facets-group" />');
      main_element.find('#hidden-facets').after(show_more);

      // Check the cookie.
      if ($.cookie("ding_factbrowers_toggle") != 'true') {
        main_element.find('#hidden-facets').hide();
        show_more.text(Drupal.t('Show more filters'));
        show_more.removeClass().addClass("expand-facets expand-facets-hidden");
      }

      show_more.click(function(e) {
        e.preventDefault();

        // Toggle facts groups and update link/button text.
        main_element.find('#hidden-facets').toggle('fast', function () {
          var visible = $(this).is(':visible');
          show_more.text(
            visible ? Drupal.t('Show less filters') : Drupal.t('Show more filters')
          );
          show_more.removeClass().addClass(
            visible ? "expand-facets expand-facets-visible" : "expand-facets expand-facets-hidden"
          );

          // Set cookie, so to remember if they where shown.
          $.cookie("ding_factbrowers_toggle", visible);
        });

        return false;
      });

      // Check for click in checkbox, and execute search.
      main_element.find('.form-type-checkbox input').change(function(e) {
        $('body').prepend('<div class="facetbrowser_overlay"><div class="spinner"></div></div>');
        window.location = $(e.target).parent().find('a').attr('href');
      });
    }
  };

  /**
   * Click handler for "Show more" buttons.
   */
  Drupal.FacetbrowserShowMore = function(e) {
    e.preventDefault();

    var $this = $(this);
    if ($this.hasClass('disabled')) {
      return;
    }

    var facetGroup = $('#' + $this.data('facetgroup'));

    var hidden = facetGroup.find('.form-type-checkbox.unselected-checkbox:hidden');

    hidden.each(function(count, facetElement) {
      if (count < Drupal.settings.dingFacetBrowser.number_of_terms) {
        $(facetElement).slideDown('fast', function() {
          if (facetGroup.find('.form-type-checkbox.unselected-checkbox:visible').size() >= Drupal.settings.dingFacetBrowser.number_of_terms &&
              count % Drupal.settings.dingFacetBrowser.number_of_terms === 0) {
            facetGroup.find('.show-less').removeClass('disabled');
          }
        });
      }
    });

    // Hide "more" button if no hidden elements left.
    hidden = facetGroup.find('.form-type-checkbox.unselected-checkbox:hidden');
    if (hidden.length == 0) {
      $this.addClass('disabled');
    }

    // Need to make sure we have the correct amount of unselected checkboxes to check against when wanting to remove the show more link.
    var unselectedSize = facetGroup.attr('count')-facetGroup.find('.form-type-checkbox.selected-checkbox').size();

    if (facetGroup.find('.form-type-checkbox.unselected-checkbox:visible').size() >= unselectedSize) {
      facetGroup.find('.show-less').addClass('disabled');
    }
  }

  /**
   * Click handler for "Show less" buttons.
   */
  Drupal.FacetbrowserShowLess = function(e) {
    e.preventDefault();
    
    var $this = $(this);
    if ($this.hasClass('disabled')) {
      return;
    }

    var facetGroup = $('#' + $this.data('facetgroup'));

    var visible = facetGroup.find('.form-type-checkbox.unselected-checkbox:visible');

    visible.each(function(count, facetElement) {
      if (count >= Drupal.settings.dingFacetBrowser.number_of_terms) {
        $(facetElement).slideUp('fast', function() {
          if (facetGroup.find('.form-type-checkbox.unselected-checkbox:visible').size() == Drupal.settings.dingFacetBrowser.number_of_terms) {
            $this.addClass('disabled');
            facetGroup.find('.show-more').removeClass('disabled');
          }
        });
      }
    });
  }

  /**
   * Fold facet groups to show only x unselected checkboxes per group.
   */
  Drupal.FoldFacetGroup = function() {

    var main_element = $(Drupal.settings.dingFacetBrowser.mainElement);

    var id = 0;
    // Add show more button to each facet group and hide some terms.
    main_element.find('fieldset').each(function() {
      var facetGroup = $(this);

      // Limit the number of visible terms in the group.
      var number_of_terms = Drupal.settings.dingFacetBrowser.number_of_terms;
      var terms_not_checked = facetGroup.find('.form-type-checkbox input:not(:checked)');
      if (terms_not_checked.size() > number_of_terms) {
        terms_not_checked.slice(number_of_terms).parent().hide();
      }

      // Add expand buttons, if there are more to show.
      if (terms_not_checked.length > number_of_terms) {
        facetGroup.find('.fieldset-wrapper').append(
          '<div class="btn-toolbar">' +
          '<div class="btn-group ">' +
          '<a class="btn btn-artesis-turquoise show-more" href="#" data-facetgroup="' + facetGroup.attr('id') + '" title="' + Drupal.t('Show more') + '">' +
          '<i class="icon-white icon-arrow-down"></i> ' +
          '</a>' +
          '<a class="btn btn-artesis-turquoise show-less disabled" href="#"data-facetgroup="' + facetGroup.attr('id') + '" title="' + Drupal.t('Show less') + '">' +
          '<i class="icon-white icon-arrow-up"></i> ' +
          '</a>' +
          '</div>' +
          '</div>'
        );
      }

      // Add some classes to checkbox wrappers.
      facetGroup.find('.form-type-checkbox input:checked').parent().addClass('selected-checkbox');
      facetGroup.find('.form-type-checkbox input:not(:checked)').parent().addClass('unselected-checkbox');

      // Add a unselect all link.
      if (facetGroup.find('.selected-checkbox-group').length) {
        // If there are show more/less buttons, add unselect to same toolbar.
        var buttons = facetGroup.find('.btn-toolbar');
        if (buttons.length != 0) {
          buttons.append('<a href="#" class="btn btn-artesis-turquoise unselect" >' + Drupal.t('Remove all selected') + '</a>');
        }
        else {
          // No toolbar, so just append.
          facetGroup.append('<a href="#" class="btn btn-artesis-turquoise unselect" >' + Drupal.t('Remove all selected') + '</a>');
        }
        facetGroup.find('legend').addClass('active');
        facetGroup.find('.fieldset-wrapper').css('display', 'block');
      }
    });

    // Bind click function to show more and show less links.
    main_element.find('.show-more').live('click', Drupal.FacetbrowserShowMore);
    main_element.find('.show-less').live('click', Drupal.FacetbrowserShowLess);

    /**
     * Bind click function to the unselect all selected checkboxes link.
     */
    main_element.find('.unselect').live('click', function(e) {
      e.preventDefault();

      var clickedKey = this;
      var facetGroup = $(clickedKey).parent().parent();
      var checkedFacets = '';
      facetGroup.find('.form-type-checkbox.selected-checkbox').each(function() {
        var element = $(this);
        // Uncheck checkboxes (for the visual effect).
        element.find('input').click();

        // Find the facets to be deselected and generate new URL.
        var facetMatch = element.find('a').attr('href').match(/&facets\[\]=-facet.*/);
        checkedFacets += facetMatch[0];
        if (checkedFacets) {
          $('body').prepend('<div class="facetbrowser_overlay"><div class="spinner"></div></div>');
          window.location.href += checkedFacets;
        }
      });

      return false;
    });
  };

})(jQuery);
