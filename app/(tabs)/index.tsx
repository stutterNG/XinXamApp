import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import React, { useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [textInput, setTextInput] = useState('');
  const [options, setOptions] = useState<{id: string, value: string}[]>([]);
  const [isShakingMode, setIsShakingMode] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(300)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const subscription = useRef<any>(null);
  const shakeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleAddOption = () => {
    if (textInput.trim() === '') return;
    setOptions([...options, { id: Date.now().toString(), value: textInput }]);
    setTextInput('');
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter(item => item.id !== id));
  };

  const handleStart = () => {
    setIsShakingMode(true);
    setResult(null);
    cardTranslateY.setValue(300);
    cardOpacity.setValue(0);
    startListening();
  };

  const handleReset = () => {
    setIsShakingMode(false);
    setResult(null);
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
  };

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true })
      ])
    ).start();
  };

  const pickRandomResult = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const randomIndex = Math.floor(Math.random() * options.length);
    setResult(options[randomIndex].value);

    Animated.parallel([
      Animated.timing(cardTranslateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 800, useNativeDriver: true })
    ]).start();
  };

  const startListening = () => {
    Accelerometer.setUpdateInterval(80);
    subscription.current = Accelerometer.addListener(({ x, y, z }) => {
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      if (acceleration > 2.2) {
        if (!isShaking) {
          setIsShaking(true);
          startShakeAnimation();
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
        shakeTimeout.current = setTimeout(() => {
          setIsShaking(false);
          shakeAnim.stopAnimation();
          shakeAnim.setValue(0);
          if (subscription.current) {
            subscription.current.remove();
            subscription.current = null;
          }
          pickRandomResult();
        }, 800);
      }
    });
  };

  const shakeRotation = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-20deg', '20deg']
  });

  // MÀN HÌNH LẮC VÀ KẾT QUẢ
  if (isShakingMode) {
    return (
      <ImageBackground source={require('../../assets/images/bg_app.jpg')} style={styles.fullBg} resizeMode="cover">
        <View style={styles.overlay}>
          {result ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Ý TRỜI ĐÃ ĐỊNH:</Text>
              <Animated.View style={[styles.cardContainer, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
                {/* ẢNH KẾT QUẢ FULL MÀN HÌNH CHỖ NÀY */}
                <Image source={require('../../assets/images/bang_ket_qua.jpg')} style={styles.fullCardImage} resizeMode="contain" />
                <Text style={styles.resultTextInside}>{result}</Text>
              </Animated.View>
              <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                <Text style={styles.buttonText}>Làm lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.shakingInstruction}>LẮC MẠNH TAY LÊN NÀO THÍ CHỦ!</Text>
              <Animated.View style={{ transform: [{ rotate: shakeRotation }] }}>
                {/* ỐNG TRE TO VẬT VÃ */}
                <Image source={require('../../assets/images/ong_tre.png')} style={styles.largeBambooImage} resizeMode="contain" />
              </Animated.View>
              {isShaking && <Text style={styles.shakingText}>Lạch cạch lạch cạch...</Text>}
              <TouchableOpacity onPress={handleReset} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ImageBackground>
    );
  }

  // MÀN HÌNH NHẬP LIỆU CŨNG CÓ BACKGOUND CHO ĐẸP
  return (
    <ImageBackground source={require('../../assets/images/bg_app.jpg')} style={styles.fullBg} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Text style={styles.mainTitle}>Nhập lựa chọn của thí chủ vào đây</Text>
        <View style={styles.inputArea}>
          <TextInput style={styles.input} placeholder="VD: Đi nhậu, Ngủ..." placeholderTextColor="#999" value={textInput} onChangeText={setTextInput} />
          <TouchableOpacity style={styles.addButton} onPress={handleAddOption}>
            <Text style={styles.buttonText}>Thêm</Text>
          </TouchableOpacity>
        </View>
        <FlatList data={options} keyExtractor={item => item.id} renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemText}>{item.value}</Text>
            <TouchableOpacity onPress={() => handleRemoveOption(item.id)}><Text style={{color:'red', fontWeight:'bold'}}>Xóa</Text></TouchableOpacity>
          </View>
        )} style={{width:'100%'}} />
        {options.length >= 2 && (
          <TouchableOpacity style={styles.bigStartButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Lắc đi nào thí chủ</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullBg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', padding: 20, paddingTop: 60, alignItems: 'center' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#3e2723', marginBottom: 20, textShadowColor: '#fff', textShadowRadius: 2 },
  inputArea: { flexDirection: 'row', width: '100%', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  addButton: { backgroundColor: '#5d4037', padding: 15, borderRadius: 8, marginLeft: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(255,255,255,0.8)', marginBottom: 8, borderRadius: 8 },
  itemText: { fontSize: 18, color: '#3e2723' },
  bigStartButton: { backgroundColor: '#8d6e63', padding: 20, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 30 },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  shakingInstruction: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 40, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 10 },
  largeBambooImage: { width: 350, height: 450 }, // Đã cho to ra
  shakingText: { color: '#ffeb3b', fontWeight: 'bold', fontSize: 20, marginTop: 30 },
  
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textShadowColor: '#000', textShadowRadius: 10 },
  cardContainer: { width: '100%', height: 400, justifyContent: 'center', alignItems: 'center' },
  fullCardImage: { width: '110%', height: '110%', position: 'absolute' }, // Tràn màn hình
  resultTextInside: { fontSize: 36, fontWeight: 'bold', color: '#3e2723', textAlign: 'center', paddingHorizontal: 50, marginTop: -20 },
  
  resetButton: { backgroundColor: '#5d4037', padding: 15, borderRadius: 10, marginTop: 50, width: 200, alignItems: 'center' },
  cancelButton: { backgroundColor: '#6c757d', padding: 15, borderRadius: 10, width: 150, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});