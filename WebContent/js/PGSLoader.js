define([], function () {
	var useDynamicVersion = true; // Change to false in production
	var version = useDynamicVersion ? new Date().getTime() : "1.0.4";
  
	return new Promise(function (resolve, reject) {
	  require(["ecm/externalJS/PGS/js/PGS.js?v=" + version], function (PGS) {
		resolve(PGS);
	  }, function (err) {
		console.error("Failed to load PGS.js", err);
		reject(err);
	  });
	});
  });
  