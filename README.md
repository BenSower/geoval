# geoval
A framework build for the easy development and research of fake-trajectories and their detection.
The framework offers
* 402 different test-trajectories
* 3 algorithms for the creation of random or more elaborate spoof-trajectories
* 4 detection algorithms, based on spatial and time-features

## Using GeoVal:

# Dependencies:
* nodeJs >= v.0.10.0: [nodeJs.org](https://nodejs.org/en/)
* mongoDB: [MongoDb.org](https://www.mongodb.org/)

# Installation instructions:
* clone the project if you haven't already: [GitHub Repository](https://github.com/BenSower/geoval)
* In the root directory run ```npm i``` to install all necessary packages listed in package.json
* To install all necessary frontend-packages, run ```bower install```
(you might have to install bower globally first by running ```npm i -g bower``` )
* run GeoVal by either running ```npm start``` to run the current version normally or
```grunt serve``` to run a dev version. For more information on the build system
and the basic project-structure visit https://github.com/DaftMonk/generator-angular-fullstack
(this project was build using the yeoman angular-fullstack generator)


#Usage instructions
* When everything runs fine, you should see a browser window opening with the GeoVal project
* Log in with the default credentials (admin@admin.com with password 'admin')
* Go to the 'Admin' page and import the training-data trajectories
* Generate spoof-trajectories of any level (you might have to restart the server for proper initialization of the lvl-3 generator)
* view the trajectories on the map
* automatically analyse all trajectories with the automatic analysis.
