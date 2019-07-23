var cluster = require('cluster')

if(cluster.isMaster) {
    var cpuCount  = require('os').cpus().length;
    console.log('*** Machine Cores available is ', cpuCount)
    for(var i=0; i < cpuCount; i+=1) {
        cluster.fork();
    }
    cluster.on('exit', function() {
        cluster.fork();
    });
} else {
    require('./app')
}
