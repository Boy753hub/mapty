'use strict';

/////////////////GETING MATERIAL////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteAll = document.querySelector('.delete_All');




let map, mapEvent;
////////////////WORKOUT CLASS/////////////////////
class Workout {
  date = new Date();
  id = String(Date.now()).slice(-10);
  clicks = 0;
  
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //km
    this.duration = duration; //min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
///////////////RUNNING CLASS///////////////
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
//////////////////CYCLING CLASS ///////////////
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescription();
    this.calcSpeed();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////APP CLASS ////////////////////
class App {
  #map;
  #mapEvent;
  #workout = [];
  #setview = 14
  #marker = []
  
  ///////////CONSTRUCTOR//////////////////
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    deleteAll.addEventListener('click' , this.reset)
  }
  
  
  
  
  
  /////////////////////////////////////////////////
  _getPosition() {
    if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
      alert('could not get your position');
    });
  }
  ////////////////////////////////////////////////
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    
    const cords = [latitude, longitude];
    
    this.#map = L.map('map').setView(cords, this.#setview);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    
    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  //////////////////////////////////////////////
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  //////////////////////////////////////////////
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'));
    
    inputCadence.value =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
    '';
  }
  ///////////////////////////////////////////////
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  /////////////////////////////////////////////////
  _newWorkout(e) {
    const validInput = (...input) => input.every(inp => Number.isFinite(inp));
    const notPositive = (...input) => input.every(inp => inp > 0);
    e.preventDefault();
    
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    
    if (type === 'running') {
      const cadance = +inputDistance.value;
      if (
        !validInput(distance, duration, cadance) ||
        !notPositive(distance, duration, cadance)
        ) {
          return alert('Inputs have to be positive numbers!');
        }
        
        workout = new Running([lat, lng], distance, duration, cadance);
      }
      
      if (type === 'cycling') {
        const elevation = +inputElevation.value;
        if (
          !validInput(distance, duration, elevation) ||
          !notPositive(distance, duration)
          ) {
            return alert('Inputs have to be positive numbers!');
          }
          workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        /////////////////////////////////////////////////
        this.#workout.push(workout);
        
        this._renderWorkoutMarker(workout);
        
        this._renderWorkout(workout);
        
        this._hideForm();
        
        this._setLocalStorage();
        
        // this._clear()
        this._delete(workout);
      }
      /////////////////////////////////////////////////////
  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
      this.#marker.push(marker)
      
      marker.markID = workout.id

  }
  //////////////////////////////////////////////////////
  _renderWorkout(workout) {
    
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__btns">
            <button class="workout__btn">
              🗑️
            </button>
          </div>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
          </span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      html += ` 
      
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
          
          </li>`;
    }
    if (workout.type === 'cycling') {
      html += ` 
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li> `;
    }
    form.insertAdjacentHTML('afterend', html);
    console.log(html.length)
     if(html.length >= 1086){
      deleteAll.classList.add('shown')
     }else{
      deleteAll.classList.remove('shown')
     }
    
    
    const btnDelete = document.querySelector(".workout__btn");

    btnDelete.addEventListener("click", this._delete.bind(this));
  }
  ////////////////////////////////////////////////////
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  ////////////////////////////////////////////////////////////////
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }
  /////MOVING TO POPUP///////////////////////////////////
  _moveToPopup(e) {
    const workoutel = e.target.closest('.workout');

    if (!workoutel) return;

    const workout = this.#workout.find(
      work => work.id === workoutel.dataset.id
    );

    this.#map.setView(workout.coords, this.#setview, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click()
  }
  //////DELETE ONE//////////////////////////////////
  _delete(workout){
    
    try {

    const eleme = workout.target.closest('.workout')
    const workouts = this.#workout.find(work =>work.id === eleme.dataset.id)
    // const data = JSON.parse(localStorage.getItem('workouts'))
    
    this.#workout.splice( workouts, 1)
    eleme.remove()
    localStorage.setItem('workouts', JSON.stringify(this.#workout));

    this.#marker.find(work => work.markID === eleme.dataset.id).remove()

    if(this.#workout.length === 0){
      deleteAll.classList.remove("shown")
    }

  } catch (error) {
      console.log(error.message);
    }
   
  }
  /////RESET///////////////////////////////////
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
