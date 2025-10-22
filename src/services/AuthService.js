import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// --- 1. CẤU HÌNH GOOGLE SIGN-IN ---
// Hãy gọi hàm này 1 lần duy nhất khi app khởi động (ví dụ: trong file App.tsx)
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '956164290007-9ked3rjilbvs6n50b5rvblkmnsg59ert.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  });
};

// --- 2. LOGIC ĐĂNG KÝ BẰNG EMAIL/PASSWORD ---
/**
 * Đăng ký tài khoản mới và tạo hồ sơ người dùng trên Firestore
 * @param {object} userData - { email, password, name }
 */
export const registerAndCreateProfile = async (userData) => {
  const { email, password, name } = userData;

  if (!email || !password || !name) {
    throw new Error('Email, mật khẩu, và tên là bắt buộc.');
  }

  try {
    // Bước 1: Tạo user trong Authentication
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const newUserId = user.uid;

    // Bước 2: Tạo hồ sơ (profile) trên Firestore
    await firestore()
      .collection('users')
      .doc(newUserId) // Dùng uid làm ID
      .set({
        name: name,
        email: email,
        photoURL: null, // User đăng ký email chưa có ảnh
        joinedAt: firestore.FieldValue.serverTimestamp(),
        mainGoal: 'Chưa thiết lập',
        familyId: null,
      });

    return user; 

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email này đã được sử dụng.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Mật khẩu quá yếu (cần ít nhất 6 ký tự).');
    }
    console.error('Lỗi khi đăng ký: ', error);
    throw new Error('Đã xảy ra lỗi đăng ký.');
  }
};

// --- 3. LOGIC ĐĂNG NHẬP BẰNG EMAIL/PASSWORD ---
/**
 * Đăng nhập bằng Email và Password
 * @param {string} email 
 * @param {string} password 
 */
export const loginWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email và mật khẩu là bắt buộc.');
  }

  try {
    // Chỉ cần gọi hàm này, Firebase sẽ tự xử lý
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    
    // (Tùy chọn) Cập nhật lần đăng nhập cuối
    await firestore().collection('users').doc(userCredential.user.uid).set({
      lastLogin: firestore.FieldValue.serverTimestamp()
    }, { merge: true }); // Dùng merge: true để không ghi đè dữ liệu cũ

    return userCredential.user;

  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Sai email hoặc mật khẩu.');
    }
     if (error.code === 'auth/invalid-email') {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    console.error('Lỗi khi đăng nhập: ', error);
    throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
  }
};


// --- 4. LOGIC ĐĂNG NHẬP BẰNG GOOGLE ---
export const onGoogleButtonPress = async () => {
  try {
    // 1. Kiểm tra Play Services & Lấy ID Token
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();

    // 2. Tạo credential cho Firebase
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // 3. Đăng nhập vào Firebase
    const userCredential = await auth().signInWithCredential(googleCredential);

    // 4. Đồng bộ hồ sơ (tạo nếu mới, cập nhật nếu cũ)
    await createOrUpdateSocialProfile(userCredential);
    
    return userCredential.user;
    
  } catch (error) {
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services không khả dụng.');
    }
    console.error(error);
    throw new Error('Đăng nhập Google thất bại.');
  }
};

// --- HÀM HỖ TRỢ: Tạo hoặc Cập nhật hồ sơ cho Social Login ---
const createOrUpdateSocialProfile = async (userCredential) => {
  const user = userCredential.user;
  const { uid, displayName, email, photoURL } = user;
  const isNewUser = userCredential.additionalUserInfo.isNewUser;

  const userRef = firestore().collection('users').doc(uid);

  try {
    const userData = {
      name: displayName || 'Người dùng Google',
      email: email,
      photoURL: photoURL || null,
      lastLogin: firestore.FieldValue.serverTimestamp(),
    };

    if (isNewUser) {
      // Nếu là user mới, set các giá trị mặc định
      await userRef.set({
        ...userData,
        joinedAt: firestore.FieldValue.serverTimestamp(),
        mainGoal: 'Chưa thiết lập',
        familyId: null,
      }, { merge: true }); // Dùng merge đề phòng
    } else {
      // Nếu là user cũ, chỉ cập nhật (merge) thông tin
      await userRef.set(userData, { merge: true });
    }
  } catch (error) {
    console.error("Lỗi khi đồng bộ hồ sơ Social Login: ", error);
  }
};