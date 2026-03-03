import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

type GlobalNavbarProps = {
  onNavigateToEvents?: () => void;
  onNavigateToSettings?: () => void;
};

/** Matches web Navbar: dark capsule bar, SemBuzz logo (left), hamburger menu (right). Before login: Register, Log In. After login: user name, Log out. */
export default function GlobalNavbar({ onNavigateToEvents, onNavigateToSettings }: GlobalNavbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <View style={styles.bar}>
        {/* Logo - same as web: orange gradient box with 3 white bars + Sem + Buzz */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <View style={[styles.logoBar, styles.logoBarLeft]} />
            <View style={[styles.logoBar, styles.logoBarCenter]} />
            <View style={[styles.logoBar, styles.logoBarRight]} />
          </View>
          <Text style={styles.sem}>Sem</Text>
          <Text style={styles.buzz}>Buzz</Text>
        </View>

        {/* Hamburger - right */}
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="Menu"
        >
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuDrawer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View style={styles.logoRow}>
                <View style={styles.logoIcon}>
                  <View style={[styles.logoBar, styles.logoBarLeft]} />
                  <View style={[styles.logoBar, styles.logoBarCenter]} />
                  <View style={[styles.logoBar, styles.logoBarRight]} />
                </View>
                <Text style={styles.sem}>Sem</Text>
                <Text style={styles.buzz}>Buzz</Text>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.menuClose}>
                <Text style={styles.menuCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuLinks}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { closeMenu(); onNavigateToEvents?.(); }}
              >
                <Text style={styles.menuItemText}>Events</Text>
              </TouchableOpacity>
              {!user ? (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => { closeMenu(); onNavigateToSettings?.(); }}
                  >
                    <Text style={styles.menuItemText}>Register</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemButton]}
                    onPress={() => { closeMenu(); onNavigateToSettings?.(); }}
                  >
                    <Text style={styles.menuItemButtonText}>Log In</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.menuUser}>
                    <Text style={styles.menuUserLabel}>Signed in as</Text>
                    <Text style={styles.menuUserName}>{user.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemOutline]}
                    onPress={() => { closeMenu(); logout(); }}
                  >
                    <Text style={styles.menuItemOutlineText}>Log out</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#ff8c42',
    marginRight: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  logoBar: {
    position: 'absolute',
    bottom: 4,
    width: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  logoBarLeft: { height: 6, left: 11 },
  logoBarCenter: { height: 10, left: 14 },
  logoBarRight: { height: 4, left: 17 },
  sem: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buzz: {
    color: '#4dabf7',
    fontSize: 18,
    fontWeight: '600',
  },
  hamburger: {
    padding: 8,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#fff',
    marginVertical: 4,
    borderRadius: 1,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  menuDrawer: {
    width: 280,
    maxWidth: '85%',
    height: '100%',
    backgroundColor: '#1a1f2e',
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuClose: {
    padding: 8,
  },
  menuCloseText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
  },
  menuLinks: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },
  menuItemButton: {
    backgroundColor: '#4dabf7',
    marginTop: 12,
    alignItems: 'center',
  },
  menuItemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    alignItems: 'center',
  },
  menuItemOutlineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuUser: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  menuUserLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  menuUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
