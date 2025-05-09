import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ImagePickerComponent, {
  useImage,
  ImageProvider,
} from "@/components/picker/imagepicker";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import axios from "axios";

interface ModalContentProps {
  modalType: string;
  onTimeSlotsChange?: (slots: string[]) => void;
  onClose?: () => void;
  onPickImage?: () => void;
  onOpenCamera?: () => void;
  onUpdateSuccess?: () => void;
}

interface User {
  nama_dokter: string;
  username_dokter: string;
  email_dokter: string;
  spesialis_dokter: string;
  str_dokter: string;
  notlp_dokter: string;
  rating_dokter: string;
  foto_profil_dokter: string | null;
}

const ModalContent: React.FC<ModalContentProps> = ({
  modalType,
  onTimeSlotsChange,
  onClose,
  onPickImage,
  onOpenCamera,
  onUpdateSuccess,
}) => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isPickerVisible, setPickerVisibility] = useState(false);
  const [isPickingStartTime, setIsPickingStartTime] = useState(true);

  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [noTlp, setNoTlp] = useState("");
  const [spesialis, setSpesialis] = useState("");

  const [userData, setUserData] = useState<User | null>(null);
  

  useEffect(() => {
    if (userData) {
      setNama(userData.nama_dokter || "");
      setUsername(userData.username_dokter || "");
      setEmail(userData.email_dokter || "");
      setNoTlp(userData.notlp_dokter || "");
      setSpesialis(userData.spesialis_dokter || "");
    }
  }, [userData]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const dokterId = await SecureStore.getItemAsync("userId");
        const cleanedId = dokterId?.replace(/"/g, "");

        const response = await axios.get(
          `https://mjk-backend-production.up.railway.app/api/dokter/getbyid/${cleanedId}`
        );

        setUserData(response.data);
      } catch (error: any) {
        console.error("Gagal mengambil data profil:", error);
        alert(error.response?.data?.message || "Gagal mengambil data user");
      }
    };

    fetchUser();
  }, []);


  const handleSubmit = async () => {
    try {
      const dokterId = await SecureStore.getItemAsync("userId");
      const cleanedDokterId = dokterId?.replace(/"/g, "");

      const response = await axios.patch(
        `https://mjk-backend-production.up.railway.app/api/dokter/update/${cleanedDokterId}`,
        {
          nama_dokter: nama,
          username_dokter: username,
          email_dokter: email,
          notlp_dokter: noTlp,
          spesialis_dokter: spesialis,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // alert("Data berhasil diperbarui!");
      onUpdateSuccess?.();
    } catch (error: any) {
      if (error.response) {
        console.error("Gagal update:", error.response.data);
        alert(error.response.data.message || "Gagal update data.");
      } else {
        console.error("Gagal update:", error.message);
        alert("Gagal terhubung ke server.");
      }
    }
  };

  const formatTime = (date: Date | null): string => {
    return date
      ? date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "--:--";
  };

  const generateTimeSlots = (): string[] => {
    if (!startTime || !endTime) return [];

    const slots: string[] = [];
    const currentTime = new Date(startTime);
    const end = new Date(endTime);

    if (end < currentTime) {
      end.setDate(end.getDate() + 1);
    }

    while (currentTime <= end) {
      slots.push(formatTime(currentTime));
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  };

  const imageContext = useImage();
  const profileImage = imageContext?.profileImage;
  const setImage = imageContext?.setImage;

  const router = useRouter();
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    onClose?.();
    router.replace("/screens/signin");
  };

  // upload image 
  const uploadImageToServer = async () => {
    if (!profileImage?.uri) {
      alert("Silakan pilih gambar terlebih dahulu.");
      return;
    }

    const uri = profileImage.uri;
    const fileName = uri.split("/").pop();
    const fileType = fileName?.split(".").pop();

    // Ambil userId dari SecureStore
    const userId = await SecureStore.getItemAsync("userId");
    const cleanedUserId = userId?.replace(/"/g, "");

    if (!cleanedUserId) {
      alert("User ID tidak ditemukan.");
      return;
    }

    const formData = new FormData();
    formData.append("image", {
      uri,
      name: fileName,
      type: `image/${fileType}`,
    } as any);
    formData.append("id", cleanedUserId); // Kirim userId sebagai bagian dari form data

    try {
      const response = await axios.post(
        // "http://192.168.18.109:3330/api/dokter/upload",
        "http://10.52.170.35:3330/api/dokter/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload berhasil:", response.data);
      alert("Foto berhasil diunggah!");
    } catch (error: any) {
      console.error("Upload gagal:", error.message);
      alert("Gagal upload gambar");
    }
  };




  switch (modalType) {
    case "pilihgambar":
      return (
        <View className="bg-white p-6 rounded-2xl w-full items-center">
          <Text className="text-xl font-semibold mb-4 text-center">
            Pilih Foto
          </Text>

          <TouchableOpacity
            className="flex-row items-center space-x-3 py-3 px-2 rounded-lg active:bg-gray-100 w-full"
            onPress={onPickImage}
          >
            <MaterialCommunityIcons name="image" size={24} color="black" />
            <Text className="text-base text-black">Ambil dari Galeri</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center space-x-3 py-3 px-2 rounded-lg active:bg-gray-100 w-full"
            onPress={onOpenCamera}
          >
            <MaterialCommunityIcons name="camera" size={24} color="black" />
            <Text className="text-base text-black">Ambil dari Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-5 py-3 bg-green-600 rounded-xl w-full"
            onPress={uploadImageToServer}
          >
            <Text className="text-center text-white font-semibold text-base">
              Upload Foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-3 py-3 bg-skyDark rounded-xl w-full"
            onPress={onClose}
          >
            <Text className="text-center text-white font-semibold text-base">
              Batal
            </Text>
          </TouchableOpacity>
        </View>
      );
    // PROFIL
    case "editprofil":
      return (
        <View>
          {/* Ganti Password */}
          <Text className="font-bold text-2xl text-skyDark mt-4 text-center">
            Edit profil
          </Text>
          {/* <View className="w-full h-[2px] bg-skyDark" /> */}
          <View className="flex flex-col items-center px-5">
            <Text className="w-full pl-1 text-base font-semibold text-skyDark pt-2">
              Nama
            </Text>
            <TextInput
              placeholder="Nama"
              // secureTextEntry
              value={nama}
              onChangeText={setNama}
              className="border-2 rounded-xl border-gray-400 p-2 w-full"
              placeholderTextColor="#888"
            />
            <Text className="w-full pl-1 text-base font-semibold text-skyDark pt-2">
              Username
            </Text>
            <TextInput
              placeholder="contoh123"
              // secureTextEntry
              value={username}
              onChangeText={setUsername}
              className="border-2 rounded-xl border-gray-400 p-2 w-full"
              placeholderTextColor="#888"
            />
            <Text className="w-full pl-1 text-base font-semibold text-skyDark pt-2">
              Email
            </Text>
            <TextInput
              placeholder="contoh@gmail.com"
              // secureTextEntry
              value={email}
              onChangeText={setEmail}
              className="border-2 rounded-xl border-gray-400 p-2 w-full"
              placeholderTextColor="#888"
            />
            <Text className="w-full pl-1 text-base font-semibold text-skyDark pt-2">
              Nomor telepon
            </Text>
            <TextInput
              placeholder="0821312312312"
              // secureTextEntry
              value={noTlp}
              onChangeText={setNoTlp}
              className="border-2 rounded-xl border-gray-400 p-2 w-full"
              placeholderTextColor="#888"
            />
            <Text className="w-full pl-1 text-base font-semibold text-skyDark pt-2">
              Spesialis
            </Text>
            <TextInput
              placeholder="Tulang"
              // secureTextEntry
              value={spesialis}
              onChangeText={setSpesialis}
              className="border-2 rounded-xl border-gray-400 p-2 w-full"
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              className="p-2 rounded-xl w-2/4 mt-6 bg-skyDark"
              onPress={handleSubmit}
            >
              <Text className="text-white text-center font-bold">Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    // UBAH JADWAL DOKTER
    case "konfirm":
      return (
        <View className="flex flex-col ">
          <Text className="text-center text-lg font-bold text-skyDark">
            Simpan perubahan jadwal?
          </Text>

          <View className="flex flex-row justify-between items-center px-20">
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-skyDark font-medium w-full">
                Batal
              </Text>
            </TouchableOpacity>
            <View className="w-[2px] h-10 text-center bg-skyDark my-5" />
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-red-500 font-medium">Oke</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "jadwaldefault":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Jadwal anda akan diatur secara default
          </Text>

          <View className="flex flex-row justify-between items-center px-20">
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-skyDark font-medium w-full">
                Batal
              </Text>
            </TouchableOpacity>
            <View className="w-[2px] h-10 text-center bg-skyDark my-5" />
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-red-500 font-medium">Oke</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "pilihjam":
      return (
        <View className="w-full px-5 py-6 bg-white rounded-2xl relative items-center">
          <TouchableOpacity
            className="absolute top-2 right-2 p-2"
            onPress={onClose}
          ></TouchableOpacity>

          <Text className="text-lg font-semibold text-gray-800 mb-6">
            Pilih Rentang Waktu
          </Text>

          <View className="flex-row items-center justify-center mb-6">
            <TouchableOpacity
              className="px-4 py-2 border border-gray-400 rounded-lg mr-4"
              onPress={() => {
                setIsPickingStartTime(true);
                setPickerVisibility(true);
              }}
            >
              <Text className="text-base">⏰ {formatTime(startTime)}</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-600"> - </Text>
            <TouchableOpacity
              className="px-4 py-2 border border-gray-400 rounded-lg ml-4"
              onPress={() => {
                setIsPickingStartTime(false);
                setPickerVisibility(true);
              }}
            >
              <Text className="text-base">⏰ {formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`px-6 py-3 rounded-xl ${
              startTime && endTime ? "bg-skyDark" : "bg-gray-400"
            }`}
            disabled={!startTime || !endTime}
            onPress={() => {
              const slots = generateTimeSlots();
              if (slots.length > 0 && onTimeSlotsChange) {
                onTimeSlotsChange(slots);
              }
            }}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Simpan
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isPickerVisible}
            mode="time"
            is24Hour
            onConfirm={(time: Date) => {
              if (isPickingStartTime) {
                setStartTime(time);
              } else {
                setEndTime(time);
              }
              setPickerVisibility(false);
            }}
            onCancel={() => setPickerVisibility(false)}
          />
        </View>
      );

    // SETTINGS
    case "hapusakun":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Anda yakin akan menghapus akun?
          </Text>

          <View className="flex flex-row justify-between items-center px-20">
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-skyDark font-medium w-full">
                Batal
              </Text>
            </TouchableOpacity>
            <View className="w-[2px] h-10 text-center bg-skyDark my-5" />
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-red-500 font-medium">
                Hapus
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "keluarakun":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Anda yakin akan keluar?
          </Text>

          <View className="flex flex-row justify-between items-center px-20">
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-skyDark font-medium w-full">
                Batal
              </Text>
            </TouchableOpacity>
            <View className="w-[2px] h-10 text-center bg-skyDark my-5" />
            <TouchableOpacity onPress={handleLogout}>
              <Text className=" text-center text-red-500 font-medium">
                Keluar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "hapusprofil":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Anda yakin akan menghapus foto profil?
          </Text>

          <View className="flex flex-row justify-between items-center px-20">
            <TouchableOpacity onPress={onClose}>
              <Text className=" text-center text-skyDark font-medium w-full">
                Batal
              </Text>
            </TouchableOpacity>
            <View className="w-[2px] h-10 text-center bg-skyDark my-5" />
            <TouchableOpacity
              onPress={() => {
                setImage?.(null);
                onClose?.();
              }}
            >
              <Text className=" text-center text-red-500 font-medium">
                Hapus
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    // SIGN IN
    case "limiter":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Terlalu banyak percobaan login. Coba lagi nanti.
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "galat":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Galat! Terjadi kesalahan yang tidak terduga
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "dokterkosong":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Harap masukkan username/STR dan password
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "gadaakun":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Akun tidak ditemukan
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "pwsalah":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Password salah
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    // RESET PASSWORD
    case "ubahberhasil":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Password berhasil diubah
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "pwlamasalah":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Password lama salah
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "pwtidakcocok":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Konfirmasi password tidak cocok
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    case "kolompwkosong":
      return (
        <View>
          <Text className="text-center text-lg font-bold text-skyDark">
            Semua kolom harus diisi
          </Text>

          <View className="w-full h-[2px] bg-skyDark my-5" />

          <TouchableOpacity
            className=" text-center text-skyDark font-medium w-full"
            onPress={onClose}
          >
            <Text className="text-center text-skyDark">Oke</Text>
          </TouchableOpacity>
        </View>
      );

    default:
      return <Text>Modal tidak ditemukan.</Text>;
  }
};

export default ModalContent;
