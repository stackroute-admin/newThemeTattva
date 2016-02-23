var mongoose = require('mongoose');
//var masterDB = mongoose.createConnection("mongodb://localhost:27017/masterDB");
// var masterDB = mongoose.createConnection("mongodb://172.23.238.253:27018/masterDB");
var masterDB = mongoose.createConnection("mongodb://localhost:27017/masterDB");
//var masterDB = mongoose.createConnection("mongodb://172.23.238.253:27018/masterDB");
//var db1 = mongoose.createConnection("mongodb://localhost/nginx");
//var db2 = mongoose.createConnection("mongodb://localhost/LogAggregate");
// var db1 = mongoose.createConnection("mongodb://172.23.238.253:27018/nginx");
//var db2 = mongoose.createConnection("mongodb://172.23.238.253:27018/LogAggregate");

var userSchema = require('./log.user.model');
var organizationSchema=require('./log.organization.model');
var gitServiceConfigSchema=require('./gitServiceInfo');
var nginxServiceConfigSchema=require('./nginxServiceConfig');
var appgitServiceConfigSchema=require('./appgitServiceConfig');

var serverSchema = require('./log.server.model');
var configSchema = require('./log.config.model');
var aptLogSchema = require('./logSchema');
var aptConfigSchema = require('./configSchema');
var commitDataSchema = require('./org_data_schema');
var gitDashBoardSchema = require('./gitlog.dashBoard.model');
var onPageLoadDashBoardSchema = require('./onLoaddashboard.model');

var organizationModel = masterDB.model('Organization',organizationSchema);
var gitServiceModel= masterDB.model('GitServiceConfig',gitServiceConfigSchema);
var nginxServiceModel= masterDB.model('nginxServiceConfig',nginxServiceConfigSchema);
var appgitServiceModel= masterDB.model('AppgitServiceConfig',appgitServiceConfigSchema);
var gitDashBoardModel = masterDB.model('gitDashBoardConfig',gitDashBoardSchema);
var onPageLoadDashBoardModel =masterDB.model('onPageLoadDashBoardConfig',onPageLoadDashBoardSchema);

org(organizationModel);
var models={};

function setDbConnection(services,orgName){
  models[orgName]={};
  for (var i = 0; i < services.length; i++) {
    var db1,db2,db3,serverModel,aptLogModel,aptConfigModel,commitDataModel;
    if(services[i]=="nginx"){
      nginxServiceModel.find({organizationName:orgName},{dbDetails:1,_id:0},function (err, docs) {
        for (var i = 0; i < docs.length; i++) {
          db1 = mongoose.createConnection("mongodb://"+docs[0].dbDetails.host+":"+docs[0].dbDetails.port+"/"+docs[0].dbDetails.dbName,function(err){
            if(err){
              console.log("error connecting to gitDB of:",orgName);
            }
          });
          models[orgName]['serverModel'] = db1.model('Logs',serverSchema);
        }
      });
    }
    else if(services[i]=="appgit"){
      appgitServiceModel.find({organizationName:orgName},{dbDetails:1,_id:0},function (err, docs) {
        for (var i = 0; i < docs.length; i++) {
          db2 = mongoose.createConnection("mongodb://"+docs[0].dbDetails.host+":"+docs[0].dbDetails.port+"/"+docs[0].dbDetails.dbName,function(err){
            if(err){
              console.log("error connecting to gitDB of:",orgName);
            }
          });
          models[orgName]['aptLogModel'] = db2.model('aptLog',aptLogSchema);
          models[orgName]['aptConfigModel'] = db2.model('aptConfig', aptConfigSchema);
          break;
        }
      });
    }
    else if (services[i]=="git") {
      gitServiceModel.find({organizationName:orgName},{dbDetails:1,_id:0},function (err, docs) {
        for (var i = 0; i < docs.length; i++) {
          db3 = mongoose.createConnection("mongodb://"+docs[0].dbDetails.host+":"+docs[0].dbDetails.port+"/"+docs[0].dbDetails.dbName,function(err){
            if(err){
              console.log("error connecting to gitDB of:",orgName);
            }
          });
          models[orgName]['commitDataModel']=db3.model('someOtherCollectionName',commitDataSchema);
        break;
      }
    });
  }
}
}

module.exports = {
  userModel : masterDB.model('User',userSchema),
  configModel : masterDB.model('Config',configSchema),
  organizationModel : organizationModel,
  gitServiceModel: gitServiceModel,
  nginxServiceModel: nginxServiceModel,
  appgitServiceModel:appgitServiceModel,
  getModel:getModel,
  gitDashBoardModel:gitDashBoardModel,
  onPageLoadDashBoardModel:onPageLoadDashBoardModel
};

function org(organizationModel){
  organizationModel.find({}, 'organizationName services', function (err, docs) {
    for(var i=0;i<docs.length;i++){
      setDbConnection(docs[i].services,docs[i].organizationName);
    }
  });
}

function getModel(organization,model){
  if(models[organization]==undefined||models[organization][model]==undefined){
    organizationModel.findOne({'organizationName':organization}, 'organizationName services', function (err, doc){
      if(err){
        return;
      }
        setDbConnection(doc.services,doc.organizationName);
      return;
    });
  }
  else{
    return models[organization][model];
  }
}
