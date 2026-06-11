import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

interface PowerBIIframeProps {
  uri: string;
  style?: ViewStyle;
}

const CROP_BOTTOM = 50;

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: `calc(100% + ${CROP_BOTTOM}px)`,
  border: 'none',
  display: 'block',
};

const hideBottomBarScript = `
  setInterval(() => {
    const bars = document.querySelectorAll('[class*="footer"], [class*="navigation"], nav, [class*="bottomBar"]');
    bars.forEach(el => {
      if (el.offsetHeight < 80) el.style.display = 'none';
    });
  }, 1000);
`;

export function PowerBIIframe({ uri, style }: PowerBIIframeProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          src={uri}
          style={iframeStyle}
          title="Dashboard PowerBI"
          allowFullScreen
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        scrollEnabled={false}
        injectedJavaScript={hideBottomBarScript}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    marginBottom: -CROP_BOTTOM,
  },
});
