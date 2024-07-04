const _= require('lodash');
const fs= require('fs')
const cityNames = [
    "Paris", "London", "New York", "Tokyo", "Berlin", "Sydney", "Rome", "Moscow", "Madrid", "Beijing"
];

const cityCoordinates = {
    Paris: { lat: 48.8566, lon: 2.3522 },
    London: { lat: 51.5074, lon: -0.1278 },
    "New York": { lat: 40.7128, lon: -74.0060 },
    Tokyo: { lat: 35.6895, lon: 139.6917 },
    Berlin: { lat: 52.5200, lon: 13.4050 },
    Sydney: { lat: -33.8688, lon: 151.2093 },
    Rome: { lat: 41.9028, lon: 12.4964 },
    Moscow: { lat: 55.7558, lon: 37.6173 },
    Madrid: { lat: 40.4168, lon: -3.7038 },
    Beijing: { lat: 39.9042, lon: 116.4074 }
};

function getRandomCityName() {
    const randomIndex = Math.floor(Math.random() * cityNames.length);
    return cityNames[randomIndex];
}

console.log(getRandomCityName());

function getWeekdays(startDate,numberOfDays){
    const weekdays=[];
    let currentDate= new Date(startDate);

    while(weekdays.length< numberOfDays){
        if(currentDate.getDay()!==0 && currentDate.getDay()!==6){
            weekdays.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate()+1);
    }
    return weekdays;
}
function getSaturday(startDate) {
    let currentDate = new Date(startDate);

    // Trouver le premier samedi après la date de début
    while (currentDate.getDay() !== 6) {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return currentDate;
}
const startDate= new Date("2021-07-01");
const numberOfWeekdays=5;
const weekdays=getWeekdays(startDate,numberOfWeekdays)

const generateLines=(numberOfLines)=>{
    return _.times(numberOfLines, (i)=>({
        id:i+1,
        nom:`L${i+1}`
    }));
};

const generateBus=(numberOfBus)=>{
    return _.times(numberOfBus,(i)=>({
        id:i+1,
        nom:`B${i+1}`,
        matricule:'jsnfb'+i
    }));
};

const generateTerminus=(numberOfTerminus)=>{
    return _.times(numberOfTerminus,(i)=>({
        id:i+1,
        nom:getRandomCityName(),
        dateDepart: new Date("2021-07-01T06:20:00")
    }));
};

const generateGares=(numberOfGares)=>{
    return _.times(numberOfGares,(i)=>({
        id:i+1,
        nom:getRandomCityName(),
        dateDepart:new Date("2021-07-01T06:20:00")
    }));
};




const lines= generateLines(100);
console.log('ligne :>> ', lines);


const buses= generateBus(150);
console.log('Bus :>> ', buses);

const terminus= generateTerminus(100);
console.log('Terminus :>> ', terminus);


const gares= generateGares(100);
console.log('Gares :>> ', gares);


const assignTerminusAndGareToLine=()=>{
     _.times(lines.length, (i)=>{
        _.assign(
            lines[i],{terminus: terminus[i]},
            {gare:gares[i]}
        )
    } );
};




function haversine(lat1,lon1,lat2,lon2){
    const toRadians= degree=>degree*Math.PI/180;
    const R=6371e3;
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a= Math.sin(Δφ/2)*Math.sin(Δφ/2)+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
    const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    const distance=R*c;
    return distance/1000;
}

function calculateTravelTime(term,gare){
    const distance= haversine(cityCoordinates[term.nom].lat,cityCoordinates[term.nom].lon,cityCoordinates[gare.nom].lat,cityCoordinates[gare.nom].lon);
    const speed=50*1000/60;
    return distance/speed;
}

function calculateOptimizeBus(line,temps_de_batement,frequence){
    const travelTime=calculateTravelTime(line.terminus,line.gare);
    return Math.ceil((temps_de_batement+travelTime)*2/frequence);
}

const temps_de_batement=15;
const frequence=20;

const optimalBusCount = () => {
    return _.map(lines, (line, i) => {
        if (i === 0) {
            return calculateOptimizeBus(line, temps_de_batement, frequence);
        } else {
            return calculateOptimizeBus(line, 0, frequence);
        }
    });
};
assignTerminusAndGareToLine();
const optimalBusResult=optimalBusCount();

/*const assignOptimizedBusOnLine=()=>{
    _.times(lines.length, (i)=>{
        const optimalBusCountForLine=optimalBusResult[i];
        const assignedBuses=_.times(optimalBusCountForLine,()=>({
            bus:buses[Math.floor(Math.random()*buses.length)]
        }));
        lines[i].assignedBuses=assignedBuses;
    })
}*/

const assignOptimizedBusOnLine=()=>{
    const availableBuses=[...buses];

    _.times(lines.length,(i)=>{
        const optimalBusCountForLine=optimalBusResult[i];
        const assignedBuses=[];

        _.times(optimalBusCountForLine,()=>{
            const randomIndex=Math.floor(Math.random()*availableBuses.length);
            const selectedBus=availableBuses[randomIndex];
            assignedBuses.push({bus:selectedBus});
            availableBuses.splice(randomIndex,1);
        });
        lines[i].assignedBuses=assignedBuses;
    })
}

assignOptimizedBusOnLine();

const adjustDepartureTimes=()=>{
    _.each(lines,(line)=>{
        const travelTimeMinutes=calculateTravelTime(line.terminus,line.gare);
        const gareDepartureOffset=travelTimeMinutes+10;
        _.each(line.assignedBuses, (assignedBus) => {
            const morningSchedules = _.map(weekdays, (day) => {
                const morningTimes = [];
                const startHour = 5.5; 
                const endHour = 12;
                const totalMinutes = (endHour - startHour) * 60;
                const totalTimePerTrip = 2 * travelTimeMinutes + 20; 
                const trips = Math.floor(totalMinutes / totalTimePerTrip);

                for (let i = 0; i < trips; i++) {
                    const terminusDepartureMorning = new Date(day);
                    terminusDepartureMorning.setHours(5, 30, 0, 0);
                    terminusDepartureMorning.setMinutes(terminusDepartureMorning.getMinutes() + i * totalTimePerTrip);
                    const gareDepartureMorning = new Date(terminusDepartureMorning);
                    gareDepartureMorning.setMinutes(gareDepartureMorning.getMinutes() + travelTimeMinutes + 10);

                    morningTimes.push({
                        terminusDeparture: terminusDepartureMorning,
                        gareDeparture: gareDepartureMorning
                    });
                }
                return morningTimes;
            });

            assignedBus.bus.schedule = _.flatten(morningSchedules);
        });

        const halfBusCount=Math.ceil(line.assignedBuses.length/2);
        const selectedBuses=_.sampleSize(line.assignedBuses,halfBusCount);
        _.each(selectedBuses,(assignedBus)=>{
            const additionalSchedules=_.map(weekdays,(day)=>{
                const terminusDepartureNoon=new Date(day);
                terminusDepartureNoon.setHours(12,30,0,0);
                const gareDepartureNoon=new Date(terminusDepartureNoon);
                gareDepartureNoon.setMinutes(gareDepartureNoon.getMinutes()+ gareDepartureOffset+15);

                return {
                    terminusDeparture:terminusDepartureNoon,
                    gareDeparture: gareDepartureNoon
                };
            });

            assignedBus.bus.schedule=assignedBus.bus.schedule.concat(additionalSchedules)
        });

        _.each(line.assignedBuses, (assignedBus) => {
            const eveningSchedules = _.map(weekdays, (day) => {
                const eveningTimes = [];
                const startHour = 16.5; 
                const endHour = 22;
                const totalMinutes = (endHour - startHour) * 60;
                const totalTimePerTrip = 2 * travelTimeMinutes + 20; 
                const trips = Math.floor(totalMinutes / totalTimePerTrip);

                for (let i = 0; i < trips; i++) {
                    const terminusDepartureEvening = new Date(day);
                    terminusDepartureEvening.setHours(16, 30, 0, 0);
                    terminusDepartureEvening.setMinutes(terminusDepartureEvening.getMinutes() + i * totalTimePerTrip);
                    const gareDepartureEvening = new Date(terminusDepartureEvening);
                    gareDepartureEvening.setMinutes(gareDepartureEvening.getMinutes() + travelTimeMinutes + 10);

                    eveningTimes.push({
                        terminusDeparture: terminusDepartureEvening,
                        gareDeparture: gareDepartureEvening
                    });
                }
                return eveningTimes;
            });
            assignedBus.bus.schedule = assignedBus.bus.schedule.concat(_.flatten(eveningSchedules));
        });

        const saturday = getSaturday(startDate);
        const weekendBusCount = Math.ceil(line.assignedBuses.length * 0.25);
        const weekendBuses = _.sampleSize(line.assignedBuses, weekendBusCount);

        _.each(weekendBuses, (assignedBus) => {
            const saturdaySchedule = _.map([saturday], (day) => {
                const morningTimes = [];
                const eveningTimes = [];

                // Deux trajets le matin entre 6h45 et 10h
                for (let i = 0; i < 2; i++) {
                    const terminusDepartureMorning = new Date(day);
                    terminusDepartureMorning.setHours(6, 45, 0, 0);
                    terminusDepartureMorning.setMinutes(terminusDepartureMorning.getMinutes() + i * (travelTimeMinutes + 10 + 60)); // Une heure d'intervalle

                    const gareDepartureMorning = new Date(terminusDepartureMorning);
                    gareDepartureMorning.setMinutes(gareDepartureMorning.getMinutes() + travelTimeMinutes + 10);

                    morningTimes.push({
                        terminusDeparture: terminusDepartureMorning,
                        gareDeparture: gareDepartureMorning
                    });
                }

                // Un trajet le soir entre 15h et 17h
                const terminusDepartureEvening = new Date(day);
                terminusDepartureEvening.setHours(15, 0, 0, 0);
                const gareDepartureEvening = new Date(terminusDepartureEvening);
                gareDepartureEvening.setMinutes(gareDepartureEvening.getMinutes() + travelTimeMinutes + 10);

                eveningTimes.push({
                    terminusDeparture: terminusDepartureEvening,
                    gareDeparture: gareDepartureEvening
                });

                return morningTimes.concat(eveningTimes);
            });

            assignedBus.bus.schedule = assignedBus.bus.schedule.concat(_.flatten(saturdaySchedule));
        });
    })
}

adjustDepartureTimes();
console.log('Horaires des bus pour la première ligne :>> ', lines[0].assignedBuses);
fs.writeFileSync('output.json', JSON.stringify(lines, null, 2), 'utf-8');

