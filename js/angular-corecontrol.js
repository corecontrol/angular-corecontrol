(function(window, angular) {
	var ngCoreControl = angular.module('ngCoreControl', []);
	ngCoreControl.service('coreControl', ['$timeout',
	function coreControlService($timeout){
		var self = this;
		var subscriptions = {};
		var subscriptions2 = {}
		var subscriptionsControlProperty = {};
		var subscriptionsModuleProperty = {};
		var subscriptionsDirectFeedback = {};
		var subscribersProperties = [];
		var controlInfo = {};
		var modules = [];
		var labels = {};
		var knobValues = {};
		var valueUpdates = [];
		var controlPropertyUpdates = [];
		var propertyUpdates = [];
		var updatesPending = false
		var vc = CORECONTROL.getInstance();
		this.cc = vc;


		this.requestAllControls = function(){
			for (var i=0; i<modules.length; i++)
				vc.SurfaceRequestAllControls(modules[i].getModule());
		}
		this.getControlEnabled = function(id)
		{
			var ctlInfo = controlInfo[id];
			if (ctlInfo){
				if (ctlInfo.enabled != undefined)
					return ctlInfo.enabled;
			}
			return true
		}
	    this.touchControl = function(id, value) {
				var fullId = id;
				var ctlInfo = controlInfo[fullId];
				if (ctlInfo){
					vc.SurfaceSetControlTouch(ctlInfo.module, ctlInfo.index, value);
				}
	    };
	    this.getControlValue = function(id) {
				var fullId = id;
				var ctlInfo = controlInfo[fullId];
				if (ctlInfo){
					if (ctlInfo.value != undefined)
						return ctlInfo.value;
				}
				return 0;
	    };
	    this.setControlValue = function(id, value) {
				var fullId = id;
				var ctlInfo = controlInfo[fullId];
				if (ctlInfo){
					vc.SurfaceSetControlValue(ctlInfo.module, ctlInfo.index, value);
				}
				if (vc.IsConnected() == false)
					setControlValueInternal(fullId, value);
				else{
					var subscribers = subscriptionsDirectFeedback[fullId];
					if (!subscribers) return;
					addValueUpdate(fullId, value)
				}
	    };
		function setControlValueInternal(id, value){
			var ctlValue = value;
			if (id.indexOf("knob") > -1){
				// provide knob
				if (knobValues[id] == undefined)
					knobValues[id] = 0.5;

				knobValues[id] += value/100;
				if (knobValues[id] > 1) knobValues[id] = 1;
				if (knobValues[id] < 0)
					knobValues[id] = 0;
				ctlValue = knobValues[id];
			}
			addValueUpdate(id, ctlValue)
		}
		this.getNumControlSteps = function(id) {
			var fullId = ""+id;
			var ctlInfo = controlInfo[fullId];
			if (ctlInfo){
				return vc.SurfaceGetControlPropertyValue(ctlInfo.module, ctlInfo.index, kCControlProperty_NumberOfSteps)
			}
			return 2;
		}
	    this.subscribeProperties = function(propertyfunc) {
			subscribersProperties.push(propertyfunc);
	    };
	    this.unsubscribeProperties = function(propertyfunc) {
			var index = subscribersProperties.indexOf(propertyfunc);
			if (index >= 0)
				subscribersProperties.splice(index, 1);
	    };
	    this.subscribe = function(id, valuefunc, priority) {
				if (!priority)
					priority = 1	// default priority
				var ids = id;
				if (typeof id == 'string' || id instanceof String){
					ids = [];
					ids.push(id);
				}
				for (var i=0; i<ids.length; i++)
				{
					var fullId = ids[i];
					if (priority==1)
					{
						var subscribers = subscriptions[fullId];
						if (!subscribers){
							subscribers = [];
							subscriptions[fullId] = subscribers;
						}
						subscribers.push(valuefunc);
					}
					if (priority==2)
					{
						var subscribers = subscriptions2[fullId];
						if (!subscribers){
							subscribers = [];
							subscriptions2[fullId] = subscribers;
						}
						subscribers.push(valuefunc);
					}
				}
	    };
	    this.unsubscribe = function(id, valuefunc) {
				var fullId = ""+id;
				var subscribers = subscriptions[fullId];
				if (subscribers)
				{
					var index = subscribers.indexOf(valuefunc);
					if (index >= 0)
						subscribers.splice(index, 1);
				}
				subscribers = subscriptions2[fullId];
				if (subscribers)
				{
					var index = subscribers.indexOf(valuefunc);
					if (index >= 0)
						subscribers.splice(index, 1);
				}
	    };
	    this.subscribeControlProperty = function(id, propertyfunc) {
			var ids = id;
			if (typeof id == 'string' || id instanceof String){
				ids = [];
				ids.push(id);
			}
			for (var i=0; i<ids.length; i++){
				var fullId = ""+ids[i];
				var subscribers = subscriptionsControlProperty[fullId];
				if (!subscribers){
					subscribers = [];
					subscriptionsControlProperty[fullId] = subscribers;
				}
				subscribers.push(propertyfunc);
			}
	    };
	    this.unsubscribeControlProperty = function(id, propertyfunc) {
			var fullId = ""+id;
			var subscribers = subscriptionsControlProperty[fullId];
			if (!subscribers) return;
			var index = subscribers.indexOf(propertyfunc);
			if (index >= 0)
				subscribers.splice(index, 1);
	    };
	    this.subscribeDirectFeedback = function(id) {
			var ids = id;
			if (typeof id == 'string' || id instanceof String){
				ids = [];
				ids.push(id);
			}
			for (var i=0; i<ids.length; i++){
				var fullId = ""+ids[i];
				subscriptionsDirectFeedback[fullId] = true;
			}
	    };
	    this.unsubscribeDirectFeedback = function(id) {
			var fullId = ""+id;
			subscriptionsDirectFeedback[fullId] = false;
	    };
	    this.subscribeModuleProperty = function(id, propertyfunc) {
			var ids = id;
			if (typeof id == 'string' || id instanceof String){
				ids = [];
				ids.push(id);
			}
			for (var i=0; i<ids.length; i++){
				var fullId = ""+ids[i];
				var subscribers = subscriptionsModuleProperty[fullId];
				if (!subscribers){
					subscribers = [];
					subscriptionsModuleProperty[fullId] = subscribers;
				}
				subscribers.push(propertyfunc);
			}
	    };
		this.getControlPropertyValue = function(id, key){
			var fullId = ""+id;
			var ctlInfo = controlInfo[fullId];
			if (ctlInfo)
				return vc.SurfaceGetControlPropertyValue(ctlInfo.module, ctlInfo.index, key);
		}
		this.getControlLabel = function(id){
			var fullId = ""+id;
			var label = labels[fullId];
			return label;
		}
		this.updateControlValue = function(id, value){
			updateControlValue(id, value);
		}
	    function updateControlValue(id, value) {
			var ctlInfo = controlInfo[id];
			if (ctlInfo){
				ctlInfo.value = value;
			}
			var subscribers = subscriptions[id];
			if (!subscribers) return;
			for (var i=0; i<subscribers.length; i++)
				subscribers[i](value, id);
	    }
	    function updateControlProperty(id, key, value) {
				var ctlInfo = controlInfo[id];
				if (ctlInfo)
					ctlInfo[key] = value;
				var subscribers = subscriptionsControlProperty[id];
				if (!subscribers) return;
				for (var i=0; i<subscribers.length; i++)
					subscribers[i](key, value);
	    }

	    
	    function updateModuleProperty(key, value)
		{
				if (key == kCControlProperty_ClientId){
					if (typeof value != 'string') return;

					// *** update vpanner navigation
					var subscribers = subscriptionsModuleProperty["vpanner/navigation"];
					if (!subscribers) return;
					for (var i=0; i<subscribers.length; i++)
					subscribers[i](value);
					
				}
	    }

		function updateValues()
		{
			updatesPending = false
			var count = valueUpdates.length
			while (count--)
			{
				var update = valueUpdates.shift()
				updateControlValue(update.id, update.value);
			}
			count = controlPropertyUpdates.length
			while (count--)
			{
				var update = controlPropertyUpdates.shift()
				updateControlProperty(update.id, update.key, update.value);
			}
			count = propertyUpdates.length
			while (count--)
			{
				var update = propertyUpdates.shift()
				updateModuleProperty(update.key, update.value);
			}
		}
		function addValueUpdate(id, value)
		{
			valueUpdates.push({id:id,value:value})
			if (updatesPending==false)
			{
				$timeout(updateValues, 20)
				updatesPending = true
			}
		}
		function addControlPropertyUpdate(id, key, value)
		{
			controlPropertyUpdates.push({id:id,key:key,value:value})
			if (updatesPending==false)
			{
				$timeout(updateValues, 20)
				updatesPending = true
			}
		}
		function addPropertyUpdate(key, value)
		{
			propertyUpdates.push({key:key,value:value})
			if (updatesPending==false)
			{
				$timeout(updateValues, 20)
				updatesPending = true
			}
		}

	    // this is a helper object for more complex surfaces
	    var Module = function(parent, ngId){
	        var self = this;
	        var indexCounter = 0;
			var path;
	        this.setup = function(){
	        }
			function getPath(){
				if (!path)
					path = vc.SurfaceGetPropertyValue(self.module, "path");
				return path;
			}
	        this.addControl = function(identifier, name, type, numSteps, feedbackType){
	            vc.SurfaceAddControl(this.module, indexCounter++, identifier, name, type);
							if (numSteps)
								vc.SurfaceSetControlPropertyValue(this.module, indexCounter-1, kCControlProperty_NumberOfSteps, numSteps);
							if (feedbackType)
									vc.SurfaceSetControlPropertyValue(this.module, indexCounter-1, kCControlProperty_FeedbackType, feedbackType);
				var id = getPath()+"/"+identifier;
	            controlInfo[id] = {'module':self.module, 'index':indexCounter-1, 'value':0.0};
	        }
	        this.addGlobalControl = function(index){
	            var identifier = getGlobalIdentifier(index);
	            var name = getGlobalName(index);
	            var type = getGlobalType(index);
	            vc.SurfaceAddControl(this.module, indexCounter++, identifier, name, type);
				var id = getPath()+"/"+identifier;
	            controlInfo[id] = {'module':self.module, 'index':indexCounter-1};
				labels[id] = getGlobalLabel(index);
	        }
	        this.publish = function(){
	            vc.SurfacePublish(this.module);
	        }
	        this.getModule = function(){
	            return self.module;
	        }
	        this.setControlValueCallback = function(surface, index, id, value){
						var fullId = getPath()+"/"+id
						addValueUpdate(fullId, value)
	        }
	        this.setControlPropertyCallback = function(surface, index, id, key, value){
						var fullId = getPath()+"/"+id
						addControlPropertyUpdate(fullId, key, value)
	        }
	        this.setPropertyCallback = function(surface, key, value){
						addPropertyUpdate(key, value)
	        }
	    }

	    this.Module = Module;
	  
	}]);
})(window, window.angular);