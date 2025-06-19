const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "",
  appId: ""
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();