import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

export function AppIcon({name, color, size = 24}) {
  return (
    <MaterialDesignIcons
      name={name}
      color={color}
      size={size}
      importantForAccessibility="no"
    />
  );
}
