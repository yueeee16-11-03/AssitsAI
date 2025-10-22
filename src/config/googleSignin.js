// src/config/googleSignin.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '943572853187-kgnl2p1l4ekrvqjtosurgaf283pshsep.apps.googleusercontent.com',
  });
};
