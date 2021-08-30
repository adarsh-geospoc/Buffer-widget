///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
  "dojo/_base/declare",
  "dojo/_base/array",
  "dojo/dom",
  'dojo/dom-style',
  'dojo/_base/html',
  "dojo/on",
  'dojo/dom-construct',
  "dojo/_base/lang",
  "dojo/store/Memory",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/ProgressBar",
  "dijit/form/FilteringSelect",
  "jimu/BaseWidget",
  "jimu/utils",
  'dojo/dom-class',
  "jimu/SpatialReference/utils",
  "jimu/dijit/SymbolChooser",
  "jimu/dijit/TabContainer",
  'esri/symbols/Font',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/TextSymbol',
  "esri/Color",
  'esri/layers/GraphicsLayer',
  "esri/tasks/GeometryService",
  "esri/tasks/Geoprocessor",
  "esri/dijit/ElevationProfile",
  "esri/units",
  "esri/symbols/CartographicLineSymbol",
  'dojo/Deferred',
  'dojo/DeferredList',
  'esri/toolbars/draw',
  'jimu/LayerInfos/LayerInfos',
  "esri/tasks/locator",
  "esri/geometry/Point",
  "esri/tasks/FeatureSet",
  'dojo/parser',
  "esri/geometry/webMercatorUtils",
  "esri/SpatialReference",
  "esri/geometry/Extent",
  "esri/tasks/ProjectParameters",
  "esri/InfoTemplate",
  "esri/graphic",
  "esri/geometry/normalizeUtils",
  "esri/tasks/BufferParameters",

  "esri/map",
  "esri/domUtils",
  
  
  
  
  "dijit/registry",
  "esri/layers/RasterLayer",
  
  
  "dijit/form/HorizontalSlider",
  "dojox/form/RangeSlider",
  "dijit/form/HorizontalRule",
  "dijit/form/HorizontalRuleLabels",
  "esri/layers/ImageServiceParameters",
  "esri/layers/MosaicRule",
  "esri/layers/RasterFunction",
  "esri/layers/DimensionalDefinition",
  "dojo/domReady!"

],
  function (
    declare,
    array,
    dom,
    domStyle,
    html,
    on,
    domConstruct,
    lang,
    Memory,
    WidgetsInTemplateMixin,
    ProgressBar,
    FilteringSelect,
    BaseWidget,
    utils,
    domClass,
    Spatialutils,
    SymbolChooser,
    TabContainer,
    Font,
    SimpleLineSymbol,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    TextSymbol,
    Color,
    GraphicsLayer,
    GeometryService,
    Geoprocessor,
    ElevationProfile,
    units,
    CartographicLineSymbol,
    Deferred,
    DeferredList,
    Draw,
    LayerInfos,
    Locator,
    Point,
    FeatureSet,
    parser,
    webMercatorUtils,
    SpatialReference,
    Extent,
    ProjectParameters,
    InfoTemplate,
    Graphic,
    normalizeUtils,
    BufferParameters
    ,
    Map, domUtils , registry, RasterLayer
    , HorizontalSlider, RangeSlider, HorizontalRule, HorizontalRuleLabels,
    ImageServiceParameters, MosaicRule, RasterFunction, DimensionalDefinition) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, WidgetsInTemplateMixin], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-Buffer',
      toolbar: null,
      symPoint: null,
      incidents: [],
      lyrIncidents: null,
      TEN_THOUSANDTHS: 4,
      MINUTES_PER_DEGREE: 60,
      SECONDS_PER_MINUTE: 60,
      SECONDS_PER_DEGREE: this.MINUTES_PER_DEGREE * this.SECONDS_PER_MINUTE,
      // epWidget: null,


      //this property is set by the framework when widget is loaded.
      //name: 'CustomWidget',


      //methods to communication with app container:

      postCreate: function () {
        this.inherited(arguments);
        //console.log('postCreate');
        // Load in coordinates to selection

        this.geometryServiceURL = lang.replace('{0}/GeometryServer', [this.config.geometryServiceURL]);
        this.SummarizeElevationURL = lang.replace('{0}/SummarizeElevation', [this.config.SummarizeElevationURL])


        var syslen = this.config.coordinateSystems.length;
        for (var a = 0; a < syslen; a++) {
          var option = {
            value: this.config.coordinateSystems[a].wkid,
            label: this.config.coordinateSystems[a].label

          };
          // console.log(option)
          this.coordSystemSelect.addOption(option);
        }

        //var typelen = this.config.initialCoords.length;
        var len = this.config.projectedCoordinateType.length;
        for (var a = 0; a < len; a++) {
          var option = {
            value: this.config.projectedCoordinateType[a].type,
            label: this.config.projectedCoordinateType[a].label
          };
          this.coordTypeSelect.addOption(option);

        };

        // var Unitlen = this.config.lengthUnit.length;
        // for (var a = 0; a < Unitlen; a++) {
        //   var option = {
        //     label: this.config.lengthUnit[a].notation,
        //     value: this.config.lengthUnit[a].value
        //   };
        //   // console.log(option)
        //   this.unitsSelect.addOption(option);
        // }
        //epWidget = null



      },

      startup: function () {
        this.inherited(arguments);

        var gsvc = new GeometryService(this.geometryServiceURL);
        gp = new Geoprocessor(this.SummarizeElevationURL)

        var mapFrame = this;
        var map = this.map;

        //console.log('zValue  widget started...');

        // if (this.coordSystemSelect.value == 4326) {
        //   this.coordTypeSelect.innerHTML = "DD"
        // }
        // EVENT - Coordinate system change
        // updateCoordinateLabels()
        on(this.coordSystemSelect, "change", updateCoordinateLabels);



        // FUNCTION - Update coordinates labels
        function updateCoordinateLabels() {

          if (mapFrame.coordSystemSelect.value == 27039) {


            mapFrame.xCoordLabel.innerHTML = "X:";
            mapFrame.yCoordLabel.innerHTML = "Y:";
          }
          else if (mapFrame.coordSystemSelect.value == 4326) {

            //console.log(t.coordTypeSelect)
            //mapFrame.coordTypeSelect.options[0].label="DD"
            // mapFrame.coordTypeSelect.options[1].label="DMS"
            mapFrame.yCoordLabel.innerHTML = "Latitude:";
            mapFrame.xCoordLabel.innerHTML = "Longitude:";
          }
        }





        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function (operLayerInfos) {
            this._initLayers();
            this._loadUI();

            //Once everything is loaded, change the flag value to false
            //This will help us in 508 support
            setTimeout(lang.hitch(this, function () {
              this.isInitialLoad = false;
            }), 500);
          }));

        // EVENT FUNCTION - Clearbutton button click
        on(this.clearButton, 'click', lang.hitch(this, function (evt) {

          // Close info window
          map.infoWindow.hide();
          // Clear existing graphics
          map.graphics.clear();
          mapFrame.xCoordTextBox.set('value', '');
          mapFrame.yCoordTextBox.set('value', '');
          if (mapFrame.mapSheetSelection) {
            mapFrame.mapSheetSelection.set('value', '');
          }
        }));

        // EVENT FUNCTION - Cleargraphic button click
        on(this.cleargraphics, 'click', lang.hitch(this, function (evt) {
          //epWidget.clearProfile(); //Clear profile
          this.map.graphics.clear();
          this._clickIncidentsButton()
          this._clickIncidentsButton(-1);
        }));

        on(this.applybuffer, 'click', lang.hitch(this, function (evt) {
          //epWidget.clearProfile(); //Clear profile
          this._dobuffer();
        }));

        // EVENT FUNCTION - locate button click
        on(this.locate, 'click', lang.hitch(this, function (evt) {
          // if(mapFrame.coordSystemSelect.value == 4326)
          // var latNum = this.yCoordTextBox.get("value");
          // console.log(latNum)
          // var lonNum = Number(this.xCoordTextBox.get("value"));
          // console.log(lonNum)
          // const point = new Point({
          //   latitude: latNum,
          //   longitude: lonNum
          // })
          // var coordinates = webMercatorUtils.geographicToWebMercator(point);
          // console.log(coordinates)
          // this._clickIncidentComplete(coordinates);

          // Get X and Y coordinates from text box
          xCoord = mapFrame.xCoordTextBox.get('value');
          yCoord = mapFrame.yCoordTextBox.get('value');

           // If map sheet selected
           if (this.coordSystemSelect.value == 4326) {


            if ((parseFloat(xCoord) > parseFloat(this.config.coordinateSystems[1].xmin)) && (parseFloat(xCoord) < parseFloat(this.config.coordinateSystems[1].xmax)) && (parseFloat(yCoord) > parseFloat(this.config.coordinateSystems[1].ymin)) && (parseFloat(yCoord) < parseFloat(this.config.coordinateSystems[1].ymax))) {



              if (this.coordTypeSelect.value == "DD") {
                var inputpoint = new Point([xCoord, yCoord], new SpatialReference({ wkid: 4326 }));
                console.log(inputpoint)


              }
              else if (this.coordTypeSelect.value == "DDM") {
                console.log("DDM")
                // set lonArray equal to inlon
                lonArray = xCoord.replace(/\s+/g, ' ').trim().split(" ");
                // set latArray equal to yCoordTextBox
                latArray = yCoord.replace(/\s+/g, ' ').trim().split(" ");
                //DD = D + (M/60)+(S/3600)
                // convert lonArray into DDM format and set to lon
                var lon = parseInt(lonArray[0]) + (parseFloat(lonArray[1]) / 60);
                // convert latArray into DDM format and set to lat
                var lat = parseInt(latArray[0]) + (parseFloat(latArray[1]) / 60);
                // create new point from lat lon and inSR and set to _inputpoint
                var inputpoint = new Point([lon, lat], new SpatialReference({ wkid: 4326 }));
                console.log(inputpoint)

              } else {
                console.log("DDS")
                // set lonArray equal to inlon
                lonArray = xCoord.replace(/\s+/g, ' ').trim().split(" ");
                // set latArray equal to inlat
                latArray = yCoord.replace(/\s+/g, ' ').trim().split(" ");

                //DD = D + (M/60)+(S/3600)
                // convert lonArray into DDS format and set to lon
                var lon = parseInt(lonArray[0]) + (parseFloat(lonArray[1]) / 60) + (parseFloat(lonArray[2]) / 3600);
                // convert latArray into DDS format and set to lat
                var lat = parseInt(latArray[0]) + (parseFloat(latArray[1]) / 60) + (parseFloat(latArray[2]) / 3600);

                var inputpoint = new Point([lon, lat], new SpatialReference({ wkid: 4326 }));
                console.log(inputpoint)
              }


              var outSR = new SpatialReference(3857);
              var params = new ProjectParameters();
              params.geometries = [inputpoint];
              params.outSR = outSR;

              var t = this
              gsvc.project(params, function (ProjectedPoints) {
                pt = ProjectedPoints[0]
                console.log(ProjectedPoints)
                // t.xCoordTextBox.set("value", ProjectedPoints[0].x);
                // t.yCoordTextBox.set("value", ProjectedPoints[0].y);
                t._clickIncidentComplete(pt);
              })




            }
            else {
              alert('check value range1')
            }


          }
          // Otherwise coordinate system selected
          else {
            // If valid input
            if ((parseFloat(xCoord) > parseFloat(this.config.coordinateSystems[0].xmin)) && (parseFloat(xCoord) < parseFloat(this.config.coordinateSystems[0].xmax)) && (parseFloat(yCoord) > parseFloat(this.config.coordinateSystems[0].ymin)) && (parseFloat(yCoord) < parseFloat(this.config.coordinateSystems[0].ymax))) {
              // Show loading bar
              // html.setStyle(mapFrame.progressBar.domNode, "display", "block");

              // Close info window
              // map.infoWindow.hide();
              // Clear existing graphics
              // map.graphics.clear();

              // Project point to map if needed
              //if (mapFrame.coordSystemSelect.value != map.spatialReference.wkid) {
              // Create new point
              var inputPoint = new Point([xCoord, yCoord], new SpatialReference({ wkid: 27039 }));

              var outSR = new SpatialReference(3857);
              var params = new ProjectParameters();
              params.geometries = [inputPoint];
              params.outSR = outSR;

              var t = this
              gsvc.project(params, function (ProjectedPoints) {
                pt = ProjectedPoints[0]
                console.log(ProjectedPoints)
                // t.xCoordTextBox.set("value", ProjectedPoints[0].x);
                // t.yCoordTextBox.set("value", ProjectedPoints[0].y);
                t._clickIncidentComplete(pt);
              })

              // this._clickIncidentComplete(inputPoint);
              // gsvc.project([inputPoint], map.spatialReference);
              // }


            }
            else {
              alert("check value range")
            }
            // // Non valid input
            // else {
            //     // Show error message
            //     domStyle.set(mapFrame.errorText, 'display', 'block');
            //     mapFrame.errorText.innerHTML = mapFrame.nls.errorMessageCoordinates;
            // }
          }


        }));

      },

      onDeActive: function () {
        this._clickIncidentsButton(-1);
      },

      disableWebMapPopup: function () {
        if (this.map) {
          this.map.setInfoWindowOnClick(false);
        }
      },

      enableWebMapPopup: function () {
        if (this.map) {
          this.map.setInfoWindowOnClick(true);
        }
      },


      //create a map based on the input web map id
      _initLayers: function () {

        this.lyrIncidents = new GraphicsLayer();
        this.map.addLayer(this.lyrIncidents);
      },

      _loadUI: function () {

        // initialize coordSystemSelectchange change event 
        on(this.coordSystemSelect, "change", lang.hitch(this, this.coordSystemSelectchange));

        //Draw buttons
        //console.log(this.folderUrl)
        var btnTitles = {
          0: this.nls.drawPoint,
          1: this.nls.drawLine,
          2: this.nls.drawPolygon
        };
        this.btnNodes = [this.SA_btn0, this.SA_btn1, this.SA_btn2];
        var cnt = 1;
        for (var i = 0; i < cnt; i++) {
          var btn = this.btnNodes[i];
          domStyle.set(btn, "backgroundImage",
            'url(' + this.folderUrl + 'images/btn' + i + '.png' + ')');
          html.setAttr(btn, 'title', btnTitles[i]);
          html.setAttr(btn, 'aria-label', btnTitles[i]);
          html.setAttr(btn, "toolNum", i);
          html.setAttr(btn, "aria-pressed", "false");
          this.own(on(btn, "click", lang.hitch(this, this._clickIncidentsButton, i)));
          this.own(on(btn, "keydown", lang.hitch(this, function (evt) {
            if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
              this._clickIncidentsButton(parseInt(domAttr.get(evt.currentTarget, "toolNum"), 10));
            }
          })));

        }

        this.toolbar = new Draw(this.map, {
          tooltipOffset: 20,
          drawTime: 90
        });
        this.toolbar.on("draw-complete", lang.hitch(this, this._drawIncident));

        this.xCoordLabel.innerHTML = "X:";
        this.yCoordLabel.innerHTML = "Y:";

        on(this.unitsSelect, "change", function (evt) {
          console.log(evt)
          // if (epWidget) {
          //  // epWidget.set("measureUnits", evt);
          // }
        })

        var chartOptions = {
          titleFontColor: "#ffffff",
          axisFontColor: "#ffffff",
          sourceTextColor: "white",
          busyIndicatorBackgroundColor: "#666"
        };
        var profileParams = {
          map: this.map,
          chartOptions: chartOptions,
          profileTaskUrl: "https://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer",
          scalebarUnits: units.MILES
        };

        // epWidget = new ElevationProfile(profileParams, this.profileChartNode);
        //epWidget.startup();
        this.map.enableMapNavigation();
        //parser.parse(); 


      },

      //changing the drop dwon option for coordinate type
      coordSystemSelectchange: function (evt) {


        this.coordTypeSelect.removeOption(this.coordTypeSelect.options)

        if (this.config.GcsWkid.includes(evt)) {
          var len = this.config.gcsCoordinateType.length;
          for (var a = 0; a < len; a++) {
            var option = {
              value: this.config.gcsCoordinateType[a].type,
              label: this.config.gcsCoordinateType[a].label
            };
            this.coordTypeSelect.addOption(option);
            this.xCoordTextBox.innerText = "Lat";
            this.yCoordTextBox.innerText = "Long";
            _projectedType = "DD";
          };
        } else {
          var len = this.config.projectedCoordinateType.length;
          for (var a = 0; a < len; a++) {
            var option = {
              value: this.config.projectedCoordinateType[a].type,
              label: this.config.projectedCoordinateType[a].label
            };
            this.coordTypeSelect.addOption(option);
            this.xCoordTextBox.innerText = "X";
            this.yCoordTextBox.innerText = "Y";
            _projectedType = "X/Y (Meters)";

          };
        }
      },

      _clickIncidentsButton: function (num) {
        var btn;
        var cnt = 1;
        if (num < cnt) {
          for (var i = 0; i < cnt; i++) {
            btn = this.btnNodes[i];
            domClass.remove(btn, "btnOn");
            html.setAttr(btn, "aria-pressed", "false");
          }
          if (num > -1 && num !== this.tool) {
            btn = this.btnNodes[num];
            if (num < cnt) {
              domClass.add(btn, "btnOn");
              html.setAttr(btn, "aria-pressed", "true");
            }
            this.tool = num;
          } else {
            this.tool = -1;
          }

          if (this.tool == 1) {
            //epWidget.clearProfile(); //Clear profile
            this.map.graphics.clear();
          }

          // console.log(this.tool)
          switch (this.tool) {
            case -1:
              this.toolbar.deactivate();
              this.enableWebMapPopup();
              break;
            case 0:
              this._clear(false);
              this.toolbar.activate(Draw.POINT);
              this.disableWebMapPopup();
              break;
            case 1:
              this._clear(false);
              this.toolbar.activate(Draw.POLYLINE);
              this.disableWebMapPopup();
              break;
            case 2:
              this._clear(false);
              this.toolbar.activate(Draw.POLYGON);
              this.disableWebMapPopup();
              break;
          }
        } else {
          this._clear(true);
        }
      },

      _saveIncident: function () {
        this.map.infoWindow.hide();
        this._updateProcessing(this.saveButton, true, this.saveSrc);
        var edits = [];



        //POINTS
        if (this.config.savePoints) {
          var pointGraphics = this._getIncidentGraphics('point', this.pointEditLayerPrototype);
          if (pointGraphics.length > 0) {
            edits.push({
              layer: this.pointEditLayer,
              graphics: pointGraphics
            });
          }
        }

        this._clickIncidentsButton(-1);
      },

      _clear: function (resetBuffer) {
        this.map.graphics.clear();
        this.lyrIncidents.clear();
      },

      _drawIncident: function (inc, v, skipZoom, skipUpdate) {


        // epWidget.clearProfile(); //Clear profile
        this.map.graphics.clear();
        this.symPoint = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SOLID, 2,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 255, 255]), 1),
          new Color([0, 255, 0, 0.25]))

        // console.log("drawend")
        var def = new Deferred();
        var evt = Array.isArray(inc) ? inc : [inc];
        var editEnabled = false;
        var updates = [];
        var updateDetails = [];
        var geoms = [];
        for (var i = 0; i < evt.length; i++) {
          var e = evt[i];
          var type = e.geometry.type;

          if (type === "point") {
            skipUpdate = true;
            this._getIncidentAddress(e);
          }

          if (e.geometry.type == "polyline") {
            this._displayElevationProfile(e)
          }

          editEnabled = type === "polyline" ? this.isLineEditable : type === "polygon" ?
            this.isPolyEditable : this.isPointEditable;

          //only geoms from user draw operations should be updated
          // those that are selected from features in the map should not be modified.
          if (skipUpdate) {
            geoms.push(e.geometry);
          } else {
            // updates.push(this._updateGeom(e.geometry));
          }

          updateDetails.push({
            symbol: type === "polyline" ? this.symLine : type === "polygon" ? this.symPoly : this.symPoint,
            attributes: e.attributes,
            infoTemplate: e.infoTemplate
          });

        }

        if (skipUpdate) {
          this._drawIncidentComplete(geoms, updateDetails, editEnabled, v, skipZoom);
          def.resolve();
        }
        return def;
      },


      _drawIncidentComplete: function (geoms, updateDetails, editEnabled, v, skipZoom) {
        console.log(geoms)
        for (var i = 0; i < geoms.length; i++) {
          var geom = geoms[i];
          var details = updateDetails[i];
          var g = new Graphic(geom, details.symbol, details.attributes, details.infoTemplate);
          //console.log(details.infoTemplate)
          this.incidents.push(g);
          this.lyrIncidents.add(g);

          //for  Z value
          var features = [];
          features.push(g);
          var featureSet = new FeatureSet();
          featureSet.features = features;
        }

        // this._dobuffer(geoms)
        // Zoom to point
        //this.map.centerAndZoom(geom, 8)

        this.setzvalue(featureSet, g)

        this._clickIncidentsButton(-1);

      },

      _dobuffer: function () {

        vals = dijit.byId("hslider").get("value");
        if(vals==0){
          trans=1
        } else if(vals==2.5){
            trans=0.75
        } else if(vals==5){
          trans=0.5
        } else if(vals==7.5){
          trans=0.25
      } else if(vals==10){
        trans=0
      }          
        //var trans=dom.byId("transparency").value
        var transparency= new Color([0, 0, 255, trans])

        this.map.graphics.clear();

        var gsvc = new GeometryService(this.geometryServiceURL);
        var incidentLayer = this.map.getLayersVisibleAtScale(this.map.getScale());

        var params = new BufferParameters();
        params.geometries = [incidentLayer[2].graphics[0].geometry]

        //buffer in linear units such as meters, km, miles etc.
        var rings=dom.byId("rings").value
        var distance=dom.byId("distance").value
        if(rings==1){
          params.distances = [ distance];
        }else if(rings==2){
          params.distances = [ distance,distance*2];
        }else if(rings==3){
          params.distances = [ distance,distance*2,distance*3];
        }else if(rings==4){
          params.distances = [ distance,distance*2,distance*3,distance*4];
        }else if(rings==5){
          params.distances = [ distance,distance*2,distance*3,distance*4,distance*5];
        }else if(rings==6){
          params.distances = [ distance,distance*2,distance*3,distance*4,distance*5,distance*6];
        }else if(rings==7){
          params.distances = [ distance,distance*2,distance*3,distance*4,distance*5,distance*6,distance*7];
        }else if(rings==8){
          params.distances = [ distance,distance*2,distance*3,distance*4,distance*5,distance*6,distance*7,distance*8];
        }else if(rings==9){
          params.distances = [ distance,distance*2,distance*3,distance*4,distance*5,distance*6,distance*7,distance*8,distance*9];
        }else if(rings==10){
          params.distances = [ distance,distance*2,distance*3,distance*4,distance*5,distance*6,distance*7,distance*8,distance*9,distance*10];
        }  
        var unit=dom.byId("unit").value
        params.unit = GeometryService[unit]
        params.outSpatialReference = this.map.spatialReference;

        gsvc.buffer(params, showBuffer);
         
        var t=this
        function showBuffer(geometries){
          var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0, 0, 255, 0.65]), 2
            ),
            transparency
          );
              console.log(symbol,geometries)
            
          array.forEach(geometries, function (geometry) {
            var graphic = new Graphic(geometry, symbol);
            t.map.graphics.add(graphic);
                      
          });
          
        }

      },

      // showBuffer: function (geometries) {
      //  // console.log(geometries)
      //   var symbol = new SimpleFillSymbol(
      //     SimpleFillSymbol.STYLE_SOLID,
      //     new SimpleLineSymbol(
      //       SimpleLineSymbol.STYLE_SOLID,
      //       new Color([0, 0, 255, 0.65]), 2
      //     ),
      //     new Color([0, 0, 255, 0.35])
      //   );
      //       console.log(map)
      //      // var t=this
      //   array.forEach(geometries, function (geometry) {
      //     var graphic = new Graphic(geometry, symbol);
      //     console.log(map.graphics)
      //     map.graphics.add(graphic);
         
      //   });
        
      // },


      _clickIncidentComplete: function (geom) {
        console.log(geom)
        var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SOLID, 10,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new Color([255, 0, 0]), 1),
          new Color([0, 255, 0, 0.25]))

        var g = new Graphic(geom, symbol);
        this.incidents.push(g);
        this.lyrIncidents.add(g);

        // Zoom to point
        this.map.centerAndZoom(geom, 8)

        this._clickIncidentsButton(-1);

      },

      _getIncidentAddress: function (pt) {
        this.incidentPoint = pt;
        this.map.graphics.clear();
        var DDx = this.incidentPoint.geographicGeometry.x
        var DDy = this.incidentPoint.geographicGeometry.y
        this._projectTONahrwan(DDx, DDy)
        //this.xCoordTextBox.set("value", DDx);
        //this.yCoordTextBox.set("value", DDy);
        this.convertIt(DDx, DDy);
      },

      _projectTONahrwan: function (lonNum, latNum) {

        var gsvc2 = new GeometryService(this.geometryServiceURL);
        const point = new Point({
          latitude: latNum,
          longitude: lonNum
        })

        if (this.coordSystemSelect.value == 4326) {
          this._displaywgs(point)
        } else {

        // make sure longitude values stays within -180/180
        normalizedPoint = point.normalize();
        // console.log(options,normalizedPoint)

        var outSR = new SpatialReference(27039);
        var params = new ProjectParameters();
        params.geometries = [normalizedPoint.normalize()];
        params.outSR = outSR;

        var t = this
        gsvc2.project(params, function (ProjectedPoints) {
          pt = ProjectedPoints[0]
          //  console.log(ProjectedPoints)
          t.xCoordTextBox.set("value", ProjectedPoints[0].x);
          t.yCoordTextBox.set("value", ProjectedPoints[0].y);
        })

      }

      },

      _displaywgs: function (e) {
        console.log(e)
        if (this.coordTypeSelect.value == "DD") {
          this.xCoordTextBox.set("value", (e.longitude).toFixed(2));
          this.yCoordTextBox.set("value", (e.latitude).toFixed(2));
        }
        else if (this.coordTypeSelect.value == "DDM") {
          wgslon=e.longitude
          wgslat=e.latitude
          // set lonArray equal to inlon
          lonArray = wgslon.toString().split(".");
          // set latArray equal to yCoordTextBox
          latArray = wgslat.toString().split(".");
          //DD = D + (M/60)+(S/3600)

          lonfixed=(lonArray[1]*60).toString();
          latfixed=(latArray[1]*60).toString()
          // convert lonArray into DDM format and set to lon
          var lon = parseInt(lonArray[0]) +" "+ lonfixed.slice(0,2)
          // convert latArray into DDM format and set to lat
          var lat = parseInt(latArray[0]) +" "+ latfixed.slice(0,2)
          
          this.xCoordTextBox.set("value", lon);
          this.yCoordTextBox.set("value", lat);

        } else if (this.coordTypeSelect.value == "DDS") {

          wgslon=e.longitude
          wgslat=e.latitude
          // set lonArray equal to inlon
          lonArray = wgslon.toString().split(".");
          // set latArray equal to yCoordTextBox
          latArray = wgslat.toString().split(".");
          //DD = D + (M/60)+(S/3600)

          lonfixedM=(lonArray[1]*60).toString();
          latfixedM=(latArray[1]*60).toString()

          lonfixedS=(lonArray[1]*3600).toString();
          latfixedS=(latArray[1]*3600).toString()
          // convert lonArray into DDM format and set to lon
          var lon = parseInt(lonArray[0]) +" "+ lonfixedM.slice(0,2)+ " "+lonfixedS.slice(2,4);
          // convert latArray into DDM format and set to lat
          var lat = parseInt(latArray[0]) +" "+ latfixedM.slice(0,2)+ " "+latfixedS.slice(2,4)
          this.xCoordTextBox.set("value", lon);
          this.yCoordTextBox.set("value", lat);


        }
      },

      setzvalue: function (featureSet, g) {
        // console.log(featureSet.features[0].geometry)

        var inputparameters = {
          "InputFeatures": featureSet,
          "DEMResolution": "FINEST"
        };

        gp.submitJob(inputparameters, Callback, statusCallback);


        // dom.byId("info").innerHTML = "Processing Request";

        function Callback(jobInfo) {
          gp.getResultData(jobInfo.jobId, "OutputSummary", showElevation)
          /// console.log(jobInfo.jobId)
        }

        function statusCallback(jobInfo) {
          //console.log(jobInfo.jobStatus);
        }

        var t = this
        function showElevation(results) {
          // console.log(results)
          elevation = results.value.features[0].attributes.MeanElevation
          console.log(elevation)

          //infotemplate
          clon = Number(t.xCoordTextBox.get("value"));
          console.log(clon)
          clat = Number(t.yCoordTextBox.get("value"));

          g.setInfoTemplate(new InfoTemplate(" Coordinates ",
            "<span>X: </span>" + clon + " meters" + "<br>" +
            "<span>Y: </span>" + clat + " meters" + "<br>" +
            "<span>Z: </span>" + results.value.features[0].attributes.MeanElevation + " meters" + "<br>"))

          t.map.infoWindow.setTitle(g.getTitle());
          t.map.infoWindow.setContent(g.getContent());
          t.map.infoWindow.show(featureSet.features[0].geometry, t.map.getInfoWindowAnchor(featureSet.features[0].geometry));
        }


      },

      convertIt: function (DDx, DDy) {
        console.log(DDx.toFixed(6), DDy.toFixed(6))
        var coordList = [];
        coordList.push("DD: (Lat, Long) " + DDy.toFixed(6) + ", " + DDx.toFixed(6));//DD
        var latDDM = this.convertDDToDegreesDecimalMinutes([DDy.toFixed(6), 0, 0], 1);//DDM
        var lonDDM = this.convertDDToDegreesDecimalMinutes([DDx.toFixed(6), 0, 0], 1);
        coordList.push(this.formatDisplayDDM(latDDM, lonDDM));
        coordList.push(this.convertToDMSStr(DDy.toFixed(6), DDx.toFixed(6)));//DMS
        console.log(coordList)

      },

      formatDisplayDDM: function (latDDM, lonDDM) {
        var latDir = (latDDM[0] < 0 ? "S" : "N");
        var lonDir = (lonDDM[0] < 0 ? "W" : "E");
        return ("DDM: " + Math.abs(latDDM[0]) + "\xB0 " + Math.abs(latDDM[1]) + "\' " + latDir + ", " + Math.abs(lonDDM[0]) + "\xB0 " + Math.abs(lonDDM[1]) + "\' " + lonDir)
      },

      truncToInt: function (n) {
        if (n > 0) {
          return Math.floor(n);
        }
        else {
          return Math.ceil(n);
        }
      },

      //expecting DD, dimension of 1, optionally dms dimension of 3
      convertDDToDegreesDecimalMinutes: function (value, dimension) {
        console.log(value)
        if (value.length !== 3) return;
        var data = value;
        var degrees = this.truncToInt(data[0]);
        var minutes = 0;
        var seconds = 0;
        if (dimension === 1) {
          minutes = this.frac(data[0]) * this.MINUTES_PER_DEGREE;
        } else if (dimension > 1) {
          minutes = data[1] + (data[2] / this.SECONDS_PER_MINUTE);
        }
        return [
          degrees,
          minutes.toFixed(this.TEN_THOUSANDTHS),
          seconds
        ];
      },

      frac: function (f) {
        return f % 1;
      },

      toDMSFromDD: function (coordinate) {
        var sign = coordinate >= 0 ? 1 : -1;
        var absolute = Math.abs(coordinate);
        var degrees = Math.floor(absolute);
        var minutesNotTruncated = (absolute - degrees) * 60;
        var minutes = Math.floor(minutesNotTruncated);
        var seconds = ((minutesNotTruncated - minutes) * 60);
        return [degrees * sign, minutes, seconds];
      },

      convertToDMSStr: function (clat, clon) {
        var lonFormattedStr = "", latFormattedStr = "", dmsLonArr = [], clon = 0, clat = 0;
        clon = Number(this.xCoordTextBox.get("value"));
        if (isNaN(clon)) return;
        dmsLonArr = this.toDMSFromDD(clon);
        lonFormattedStr = this.formatDisplayDMS("LON", dmsLonArr);
        clat = Number(this.yCoordTextBox.get("value"));
        if (isNaN(clat)) return;
        dmsLatArr = this.toDMSFromDD(clat);
        latFormattedStr = this.formatDisplayDMS("LAT", dmsLatArr);
        return "DMS:" + latFormattedStr + ", " + lonFormattedStr;
      },

      formatDisplayDMS: function (dir, dmsArr) {
        var min = dmsArr[1] < 10 ? "0" + dmsArr[1] + "' " : dmsArr[1] + "' ";
        var sec = dmsArr[2] < 10 ? "0" + dmsArr[2].toFixed(3) + " " : dmsArr[2].toFixed(3) + "";
        var dmsDir = (dir === "LAT") ? (dmsArr[0] < 0 ? "S" : "N") : (dmsArr[0] < 0 ? "W" : "E");
        return Math.abs(dmsArr[0]) + "\xB0 " + min + sec + dmsDir;
      },

      _displayElevationProfile: function (e) {


        lineSymbol = new CartographicLineSymbol(
          CartographicLineSymbol.STYLE_SOLID,
          new Color([255, 0, 0]), 2,
          CartographicLineSymbol.CAP_ROUND,
          CartographicLineSymbol.JOIN_MITER, 2
        );

        var symbol = lineSymbol;
        this.map.graphics.add(new Graphic(e.geometry, symbol));
        //epWidget.set("profileGeometry", e.geometry);

      }






      // onClose: function(){
      //   console.log('onClose');
      // },

      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }

      //methods to communication between widgets:

    });
  });