import { data } from 'app/actions/actionTypes';
import * as DataService from './data';

const getUserData = result => ({
  uid: result.uid,
  displayName: result.displayName,
  email: result.email,
  avatar: result.photoURL,
});

export const init = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  firebase.auth().useDeviceLanguage();
};

export const registerAuth = store => (
  new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged((result) => {
      if (result) {
        const state = store.getState();
        if (state.auth.uid !== result.uid) {
          store.dispatch({
            type: 'SIGNIN_FULFILLED',
          });
          store.dispatch({
            type: data.MY_PROFILE,
            payload: getUserData(result)
          });
          resolve(result.uid);
          DataService.register(store, result.uid);
        }
      } else {
        store.dispatch({
          type: 'SIGNIN_REJECTED',
        });
        reject();
      }
    });
  })
);

export const signIn = () => (
  new Promise((resolve, reject) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  })
);

export const signOut = () => (
  new Promise((resolve, reject) => {
    firebase.auth().signOut()
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  })
);

export const isNewUser = uid => (
  new Promise((resolve) => {
    firebase.database().ref(`/users/${uid}`).on('value', (snap) => {
      if (!snap.exists()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  })
);

export const addDestination = (uid, destination, isDefault) => (
  new Promise((resolve, reject) => {
    const destinationRef = firebase.database().ref('/destinations').push();
    destinationRef.set(destination).then(() => {
      firebase.database().ref(`/users/${uid}/destinations`).push()
        .set(destinationRef.key)
        .then(() => {
          if (isDefault) {
            firebase.database().ref(`/users/${uid}/defaultDestination`).set(destinationRef.key)
              .then(() => {
                Materialize.toast('Default destination added successfully!', 2000, 'grey darken-4');
              }, (error) => {
                Materialize.toast('An error occurred while setting your destination as default', 2000, 'red');
                reject(error);
              });
          } else {
            Materialize.toast('Destination added successfully!', 2000, 'grey darken-4');
          }
          resolve();
        }, (error) => {
          Materialize.toast('An error occurred while saving your destination', 2000, 'red');
          reject(error);
        });
    }, (error) => {
      Materialize.toast('An error occurred while saving your destination', 2000, 'red');
      reject(error);
    });
  })
);
