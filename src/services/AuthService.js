import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// Import thêm 'statusCodes'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// --- 1. CẤU HÌNH GOOGLE SIGN-IN ---
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '1004216653681-boggt7av4q5cv1bk1jq7eo15a108cod7.apps.googleusercontent.com',
    // Yêu cầu 'idToken' một cách rõ ràng
    requestIdToken: true,
    // Các scopes này là cần thiết
    scopes: ['profile', 'email'],
    // Bỏ 2 dòng này đi
    // offlineAccess: true, 
    // forceCodeForRefreshToken: true,
  });
};

// --- 2. LOGIC ĐĂNG KÝ BẰNG EMAIL/PASSWORD ---
export const registerAndCreateProfile = async (userData) => {
  const { email, password, name } = userData;

  if (!email || !password || !name) {
    throw new Error('Email, mật khẩu, và tên là bắt buộc.');
  }

  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const newUserId = user.uid;

    await firestore()
      .collection('users')
      .doc(newUserId)
      .set({
        name: name,
        email: email,
        photoURL: null,
        joinedAt: firestore.FieldValue.serverTimestamp(),
        mainGoal: 'Chưa thiết lập',
        familyId: null,
      });

    return user; 

  } catch (error) {
    if (error && error.code === 'auth/email-already-in-use') {
      throw new Error('Email này đã được sử dụng.');
    }
    if (error && error.code === 'auth/invalid-email') {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    if (error && error.code === 'auth/weak-password') {
      throw new Error('Mật khẩu quá yếu (cần ít nhất 6 ký tự).');
    }
    console.error('Lỗi khi đăng ký: ', error);
    throw new Error('Đã xảy ra lỗi đăng ký.');
  }
};

// --- 3. LOGIC ĐĂNG NHẬP BẰNG EMAIL/PASSWORD ---
export const loginWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email và mật khẩu là bắt buộc.');
  }

  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    
    await firestore().collection('users').doc(userCredential.user.uid).set({
      lastLogin: firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return userCredential.user;

  } catch (error) {
    if (error && (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')) {
      throw new Error('Sai email hoặc mật khẩu.');
    }
    if (error && error.code === 'auth/invalid-email') {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    console.error('Lỗi khi đăng nhập: ', error);
    throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
}
};


// --- 4. LOGIC ĐĂNG NHẬP BẰNG GOOGLE ---
export const onGoogleButtonPress = async () => {
  try {
    // THÊM MỚI: Luôn đăng xuất khỏi Google Sign-in trước
    // để buộc hiển thị cửa sổ chọn tài khoản.
    await GoogleSignin.signOut();

    await GoogleSignin.hasPlayServices();
    
    // Đổi tên biến để rõ ràng hơn
    const userInfoResponse = await GoogleSignin.signIn();

    // SỬA LỖI: Kiểm tra 'userInfoResponse.data.idToken'
    if (!userInfoResponse || !userInfoResponse.data || !userInfoResponse.data.idToken) {
      console.error('GoogleSignin.signIn() không trả về data.idToken.', userInfoResponse);
      throw new Error('Không thể lấy idToken từ Google.');
    }

    // SỬA LỖI: Lấy idToken từ 'userInfoResponse.data.idToken'
    const googleCredential = auth.GoogleAuthProvider.credential(userInfoResponse.data.idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    await createOrUpdateSocialProfile(userCredential);
    
    return userCredential.user;
    
  } catch (error) {
    if (error && error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('Người dùng đã hủy đăng nhập Google.');
      return;
    } 
    if (error && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.error('Google Play Services không khả dụng hoặc đã cũ.');
      throw new Error('Google Play Services không khả dụng.');
    } 
    
    console.error('Lỗi Google Sign-in không xác định: ', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đăng nhập Google thất bại.');
  }
};

// --- HÀM HỖ TRỢ: Tạo hoặc Cập nhật hồ sơ cho Social Login ---
const createOrUpdateSocialProfile = async (userCredential) => {
  const user = userCredential.user;
  const { uid, displayName, email, photoURL } = user;
  
  const isNewUser = userCredential.additionalUserInfo?.isNewUser || false;

  const userRef = firestore().collection('users').doc(uid);

  try {
    const userData = {
      name: displayName || 'Người dùng Google',
      email: email,
      photoURL: photoURL || null,
      lastLogin: firestore.FieldValue.serverTimestamp(),
    };

    if (isNewUser) {
      await userRef.set({
        ...userData,
        joinedAt: firestore.FieldValue.serverTimestamp(),
        mainGoal: 'Chưa thiết lập',
        familyId: null,
      }, { merge: true });
    } else {
      await userRef.set(userData, { merge: true });
    }
  } catch (error) {
    console.error("Lỗi khi đồng bộ hồ sơ Social Login: ", error);
  }
};

