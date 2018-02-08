import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

const styles = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

const Spinner = ({ size, color }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size || 'large'}
        color={color || '#AEA8D3'}
      />
    </View>
  );
};

Spinner.propTypes = {
  size: PropTypes.string,
  color: PropTypes.string,
};

export { Spinner };
