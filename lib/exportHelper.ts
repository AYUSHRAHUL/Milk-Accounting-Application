import { Platform, Alert } from 'react-native';
import { writeAsStringAsync, EncodingType, cacheDirectory, documentDirectory, StorageAccessFramework } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper to export CSV directly to device storage without repeatedly asking for location.
 * Acts like a browser download. 
 */
export const downloadCSVLocally = async (csvData: string, baseFileName: string, dialogTitle: string) => {
  const fileName = `${baseFileName}_${Date.now()}.csv`;

  if (Platform.OS === 'android') {
    // 1. First attempt a silent direct write to the public Downloads folder (Works on many Android 11+ devices)
    try {
      const publicDownloadUri = 'file:///storage/emulated/0/Download/' + fileName;
      await writeAsStringAsync(publicDownloadUri, csvData, { encoding: EncodingType.UTF8 });
      Alert.alert('Download Complete', `File saved to Downloads folder:\n${fileName}`);
      return;
    } catch (directWriteError) {
      // Direct write to public folder denied or failed, fallback to SAF (Storage Access Framework)
      // SAF prompts the user once, but we can save their chosen directory for future silent writes.
      
      try {
        const STORAGE_KEY = '@app_export_directory_uri';
        let savedDirUri = await AsyncStorage.getItem(STORAGE_KEY);
        
        // If we have a previously saved directory from SAF, write silently to it!
        if (savedDirUri) {
          try {
            const fileUri = await StorageAccessFramework.createFileAsync(savedDirUri, fileName, 'text/csv');
            await writeAsStringAsync(fileUri, csvData, { encoding: EncodingType.UTF8 });
            Alert.alert('Download Complete', 'File saved natively to your device.');
            return;
          } catch (e) {
            // Saved directory is no longer valid (deleted, permission revoked, etc.), clear it
            await AsyncStorage.removeItem(STORAGE_KEY);
            savedDirUri = null;
          }
        }

        // If no saved directory, or it became invalid, ask the user *just once* to pick a folder (ideally Downloads)
        if (!savedDirUri) {
          const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(
            StorageAccessFramework.getUriForDirectoryInRoot('Download')
          );
          
          if (permissions.granted) {
            // Remember this location for the future so we never have to ask again!
            await AsyncStorage.setItem(STORAGE_KEY, permissions.directoryUri);
            
            const fileUri = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'text/csv');
            await writeAsStringAsync(fileUri, csvData, { encoding: EncodingType.UTF8 });
            Alert.alert('Download Complete', 'File saved natively. Future downloads will automatically save here.');
          } else {
            Alert.alert('Permission Denied', 'Storage permission is required to save the file.');
          }
        }

      } catch (safError: any) {
        Alert.alert('Export Failed', 'Details: ' + safError.message);
      }
    }
  } else {
    // iOS and others (Opening share sheet is standard because iOS has no public "Downloads" folder that apps can silently drop into)
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      const dir = cacheDirectory || documentDirectory;
      if (!dir) {
        Alert.alert('Error', 'Storage not available on this device.');
        return;
      }
      
      // Ensure trailing slash for dir
      const dirWithSlash = dir.endsWith('/') ? dir : dir + '/';
      const fileUri = `${dirWithSlash}${fileName}`;
      
      await writeAsStringAsync(fileUri, csvData, { encoding: EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: dialogTitle,
        UTI: 'public.comma-separated-values',
      });
    } catch (error: any) {
        Alert.alert('Export Failed', 'Details: ' + error.message);
    }
  }
};
