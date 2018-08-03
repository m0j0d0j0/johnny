(function() {
  // Setup the vars
  // --------------

  var ENDPOINT = '/data/CENSUS_STATEAGESEX_BINS.json';
  // Use this endpoint when connecting to a backend API. Feel free to change
  // the URL as needed for your environment.
  // var ENDPOINT = 'https://localhost:8081/api/states/age-bins';

  // DOM selector references.
  var stateSelect       = '#stateSelect',
      populationSelect  = '#populationSelect',
      visContainer      = '#viz';

  var populationContainerTemplateStr =
      '<div class="population-container"></div>',
      populationBarTemplateStr =
      '<div class="<%= classes %> population-bar"></div>',
      populationValueTemplateStr =
      '<div class="<%= classes %> population-value"><%= value %></div>',
      rangeLabelTemplateStr =
      '<div class="range-label"><%= label %></div>';

  // Make the templates
  var populationContainerTemplate = _.template(populationContainerTemplateStr),
      populationBarTemplate       = _.template(populationBarTemplateStr),
      populationValueTemplate     = _.template(populationValueTemplateStr),
      rangeLabelTemplate          = _.template(rangeLabelTemplateStr);


  // Setup filter interactions
  // -------------------------

  function listenForStateChange(data) {
    $(stateSelect).on('change', function() {
      update(data);
    });
  }

  function listenForPopulationChange(data) {
    $(populationSelect).on('change', function() {
      update(data);
    });
  }

  // Display the available states in the drop down.
  function displayStateOptions(data) {
    var $stateSelect = $(stateSelect);
    $stateSelect.empty();
    _.keys(data).forEach(function(state) {
      $stateSelect.append('<option value="' + state + '">' + state + '</option>');
    });
  }


  // Method to get a linear scale.
  // ------------------------------
  // Scales are used frequently in visualization.
  // They are a function that maps a *domain* of values in data to a visual *range* which may be colors, widths or positions.
  //
  // For instance, a linear scale may map the *domain* of data values from 2000->105023 to the *range* of bar widths between 0px and 100px.

  function scaleLinear() {

    var range = [],
        domain = [];

    function scale(x) {
      var rangeMin = range[0],
          rangeMax = range[1];

      var domainMin = domain[0],
          domainMax = domain[1];

      return ((rangeMax - rangeMin) * (x - domainMin) / (domainMax - domainMin)) + rangeMin;
    }

    scale.range = function(_arr) {
      if (! arguments.length) return range;
      range = _arr;
      return scale;
    };

    scale.domain = function(_arr) {
      if (! arguments.length) return domain;
      domain = _arr;
      return scale;
    };

    return scale;
  }


  // The visualization renderer
  // --------------------------

  function renderViz(data, selectedPopulation) {

    var visWidth = 700,
        maxBarWidth = 200,
        containerHeight = 44;

    // Get the Men data for the selectecd population year.
    var mData = data.m.map(function(o) {
      return o[selectedPopulation];
    });

    // Get the Women data for the selected population year.
    var fData = data.f.map(function(o) {
      return o[selectedPopulation];
    });

    // Find the minimum and maximum values across the male and female populations.
    var min = Math.min.apply(null, fData),
        max = Math.max.apply(null, fData);

    // Create a linear scale that maps from the domain of min and max data values to the range of bar widths.
    var scale = scaleLinear().range([10, maxBarWidth]).domain([min, max]);

    var $vis = $(visContainer).css('width', visWidth);
    $vis.empty();

    // Start rendering the bars.
    var len = Math.max(mData.length, fData.length);
    for (var i=0; i<len; i++) {
      var $barContainer = $( populationContainerTemplate() );
      $barContainer.css('top', i*containerHeight);

      var rangeLabel = '';

      // Render the "Men" bar.
      if (mData[i]) {
        rangeLabel = data.m[i].range.join(' - ');

        var mWidth = scale(mData[i]),
            mLeft = visWidth/2;

        if (mWidth < 0) mWidth = 0;

        var $mBar = $( populationBarTemplate({ classes: 'male' }) );
        $mBar.css({width: mWidth, left: mLeft});

        var $mValue = $( populationValueTemplate({ classes: 'right', value: mData[i] }) );
        $mValue.css({ left: mWidth });

        $mBar.append($mValue);
        $barContainer.append($mBar);
      }

      // Render the "Women" bar.
      if (fData[i]) {
        rangeLabel = data.m[i].range.join(' - ');

        var fWidth = scale(fData[i]),
            fLeft = visWidth/2 - fWidth;

        if (fWidth < 0) fWidth = 0;

        var $fBar = $( populationBarTemplate({ classes: 'female' }) );

        $fBar.css({width: fWidth, left: fLeft});

        var $fValue = $( populationValueTemplate({ classes: 'right', value: fData[i] }) );

        $fValue.css({ right: fWidth });

        $fBar.append($fValue);
        $barContainer.append($fBar);
      }

      // Add the label that displays the age ranges.
      var $rangeLabel = $( rangeLabelTemplate({ label: rangeLabel }) );
      $barContainer.append($rangeLabel);

      $vis.append($barContainer);
    }
  }


  // Update the visualization
  // -------------------------

  function update(data) {
    var selectedState = $(stateSelect).val(),
        selectedPopulation = $(populationSelect).val();

    var stateData = data[selectedState];
    renderViz(stateData, selectedPopulation);
  }


  // Kick off
  // --------

  function kickoff(data) {
    $(function() {
      displayStateOptions(data);
      listenForStateChange(data);
      listenForPopulationChange(data);
      update(data);
    });
  }


  // Fetch the data and kickoff the rendering
  // ----------------------------------------

  function getData() {
    var endpoint_tag = $('#endpoint');
    endpoint_tag.text(ENDPOINT);
    endpoint_tag.attr('href', ENDPOINT);
    $.ajax(ENDPOINT)
      .done(function(data) {
        if (data) {
          kickoff(data);
        }
      });
  }


  // Init
  // -----

  getData();

})();
