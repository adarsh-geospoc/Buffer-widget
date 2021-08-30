///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
  "dojo/_base/lang",
  "dojo/on",
  "dojo/_base/html",
  "dojo/json",
  "dojo/Deferred",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/_base/array",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/form/Select",
  "jimu/dijit/Message",
  "jimu/BaseWidgetSetting",
  "jimu/dijit/SimpleTable",
  "jimu/SpatialReference/srUtils",
  "esri/request"
],
  function (
    declare,
    lang,
    on,
    html,
    dojoJSON,
    Deferred,
    domStyle,
    domAttr,
    array,
    WidgetsInTemplateMixin,
    Select,
    Message,
    BaseWidgetSetting,
    Table,
    utils,
    esriRequest,
    domclass
  ) {
    return declare([BaseWidgetSetting, WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-Buffer-setting',

      // EVENT FUNCTION - Startup configure widget
      startup: function () {
        console.log('Configure locate coordinates widget started ...');
        this.inherited(arguments);
      
        // Set the default configuration parameters from the config file
        this.setConfig(this.config);
        // Set loading image
        // Check the URLs
       // this.own(on(this.geometryServiceURL, 'Change', lang.hitch(this, this.onUrlChange)));
       // this.own(on(this.SummarizeElevationURL, 'Change', lang.hitch(this, this.onUrlChange)));

      },

      // FUNCTION - Set the default configuration parameters in the configure widget from the config file
      setConfig: function (config) {
        this.config = config;

        // Set the geometry service URL
        this.geometryServiceURL.set('value', this.config.geometryServiceURL);
        this.SummarizeElevationURL.set('value', this.config.SummarizeElevationURL);
        this.profileTaskUrl.set('value', this.config.profileTaskUrl);

        // Setup the coordinates table
        var fields = [{
          name: 'label',
          title: this.nls.coordinateSystem,
          type: 'text',

          unique: false,
          editable: false
        }, {
          name: 'wkid',
          title: this.nls.spatialReference,
          type: 'text',
          unique: false,
          editable: false
        }, {
          name: 'xmin',
          title: "XMin",
          type: 'text',
          unique: false,
          editable: false
        }, {
          name: 'xmax',
          title: "XMax",
          type: 'text',
          unique: false,
          editable: false
        }, {
          name: 'ymin',
          title: "YMin",
          type: 'text',
          unique: false,
          editable: false
        }, {
          name: 'ymax',
          title: "YMax",
          type: 'text',
          unique: false,
          editable: false
        },
        {
          name: '',
          title: '',
          width: '100px',
          type: 'actions',
          actions: ['up', 'down', 'delete']
        }
        ];
        var args = {
          fields: fields,
          selectable: false
        };
        this.CoordTable = new Table(args);
        this.CoordTable.autoHeight = true;
        this.CoordTable.placeAt(this.coordSystemsTable);
        this.CoordTable.startup();

        // Load in coordinate systems and extents
        if (this.config.coordinateSystems.length > 0) {
          var json = [];
          var len = this.config.coordinateSystems.length;
          for (var a = 0; a < len; a++) {
            json.push({
              label: this.config.coordinateSystems[a].label,
              wkid: this.config.coordinateSystems[a].wkid,
              xmin: this.config.coordinateSystems[a].xmin,
              xmax: this.config.coordinateSystems[a].xmax,
              ymin: this.config.coordinateSystems[a].ymin,
              ymax: this.config.coordinateSystems[a].ymax
            });
          }
          this.CoordTable.addRows(json);
        }

       

      },

       

      // FUNCTION - Get the configuration parameters from the configure widget and load into configuration file
      getConfig: function () {
        // Get geometry service URL
        this.config.geometryServiceURL = this.geometryServiceURL.get('value');
        this.config.SummarizeElevationURL = this.SummarizeElevationURL.get('value');
        this.config.profileTaskUrl=this.profileTaskUrl.get('value')

        // Get the coordinate systems
        var data = this.CoordTable.getData();
        var json = [];
        var len = data.length;
        for (var i = 0; i < len; i++) {
          json.push(data[i]);
        }
        this.config.coordinateSystems = json;

        // Return the configuration parameters
        return this.config;
      }

    });
  });