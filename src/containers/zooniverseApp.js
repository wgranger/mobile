import React, {Component} from 'react'
import {
  Platform,
  PushNotificationIOS,
  View
} from 'react-native'
import PropTypes from 'prop-types';
import EStyleSheet from 'react-native-extended-stylesheet'
import ProjectDisciplines from '../components/ProjectDisciplines'
import NotificationModal from '../components/NotificationModal'
import LaunchScreen from '../components/Launch'
import NavBar from '../components/NavBar'
import { connect } from 'react-redux'
import { setState, syncInterestSubscriptions } from '../actions/index'
import { setDimensions } from '../actions/device'
import { isEmpty, pathOr } from 'ramda'
import FCM, { FCMEvent } from 'react-native-fcm'

const mapStateToProps = (state) => ({
  user: state.user,
  isFetching: state.isFetching,
  isConnected: state.isConnected,
  isModalVisible: state.isModalVisible || false,
  notificationPayload: state.notificationPayload || {}
})

const mapDispatchToProps = (dispatch) => ({
  setModalVisibility(value) {
    dispatch(setState('isModalVisible', value))
  },
  setNotificationPayload(value) {
    dispatch(setState('notificationPayload', value))
  },
  syncInterestSubscriptions() {
    dispatch(syncInterestSubscriptions())
  },
  setDimensions() {
    dispatch(setDimensions())
  },
})

class ZooniverseApp extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.setDimensions()

    if (Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('notification', this.onRemoteNotification)
      PushNotificationIOS.addEventListener('register', this.onPushRegistration)
    } else {
      FCM.on(FCMEvent.Notification, this.onRemoteNotification)
    }
  }

  componentWillUnmount() {
    PushNotificationIOS.removeEventListener('notification', this.onRemoteNotification);
    PushNotificationIOS.removeEventListener('register', this.onPushRegistration)
  }

  onRemoteNotification = (notification) => {
    //this is called on iOS < 10 when registered, so make sure it's a valid push notification
    let isValidIOS = Platform.OS === 'ios' && !pathOr(false, ['_data', 'pusher_token_validation'], notification)
    let isValidAndroid = Platform.OS === 'android' && notification.title

    if (isValidIOS || isValidAndroid) {
      this.props.setNotificationPayload(notification)
      this.props.setModalVisibility(true)
    }
  }

  onPushRegistration = () => {
    this.props.syncInterestSubscriptions()
  }

  static renderNavigationBar() {
    return <NavBar showAvatar={true} />;
  }

  render() {
    return (
      <View style={styles.container}>
        { isEmpty(this.props.user) ? <LaunchScreen /> : <ProjectDisciplines /> }
        <NotificationModal
          isVisible={this.props.isModalVisible}
          setVisibility={this.props.setModalVisibility}/>
      </View>
    )
  }
}

const styles = EStyleSheet.create({
  container: {
    flex: 1,
  },
});

ZooniverseApp.propTypes = {
  user: PropTypes.object,
  isFetching: PropTypes.bool.isRequired,
  isConnected: PropTypes.bool,
  isModalVisible: PropTypes.bool,
  setModalVisibility: PropTypes.func,
  setNotificationPayload: PropTypes.func,
  syncInterestSubscriptions: PropTypes.func,
  setDimensions: PropTypes.func,
}

export default connect(mapStateToProps, mapDispatchToProps)(ZooniverseApp)
