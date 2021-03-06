import React, {Component} from 'react'
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableHighlight,
    Alert,
    ScrollView,
    FlatList,
    Image,
    Switch,
    AsyncStorage
} from 'react-native';

const io = require('socket.io-client');
import get from 'lodash/get';
import { connect } from 'react-redux';
import call from 'react-native-phone-call'

import Expo, { Permissions, Notifications } from 'expo';

async function registerForPushNotificationsAsync(id, token) {
    const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    if (existingStatus === 'granted' && token) return;
    const {status} = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    if (status !== 'granted') return;

    // Get the token that uniquely identifies this device
    let pushToken = await Notifications.getExpoPushTokenAsync();
    if (pushToken && id) {
        fetch(`https://hack-slash-cab.herokuapp.com/user/${id}`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({pushToken}),
        }).then(response => {
            return response.json();
        }).then(data => {
            console.log("ResponseData", data)
        }).catch(err => {
            console.log("Error", err);
        });
    }
}

class List extends Component {
    constructor(props) {
        super(props);
        console.log(props,">?>?>?>")
        this.socket = io('https://hack-slash-cab.herokuapp.com');
        this.state = {
            notification: '',
            user: get(props, 'user.user'),
            mates: [],
            cab: {},
            status:false
        }
    }

    async componentDidMount() {
      const { _id, pushToken } = this.state.user;
      registerForPushNotificationsAsync(_id, pushToken);
      this._notificationSubscription = Notifications.addListener(this._handleNotification);
    }

    componentWillMount() {
        let cabId = get(this.state, 'user.cabId');
        if (cabId) {
            fetch(`https://hack-slash-cab.herokuapp.com/cab/${cabId}`, {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                }
            }).then(response => {
                return response.json();
            }).then(data => {
                console.log("ResponseDate comp mount, ", data);
                const currentUser=data.cabMates.find(mate => mate.id === this.state.user._id)
                this.setState({
                    mates: data.cabMates,
                    cab: data,
                    status: currentUser.presence
                });
            }).catch(err => {
                console.log(err, 'Error-- comp mount')
            });

            this.socket.on('connect', () => {
                console.log('connected');
                this.socket.emit('joined', {data: {cabId}});
            })
        }
    }

    _handleNotification = (notification) => {
        const msg = get(notification, 'data.msg');
        if (msg) {
          // this.props.navigation.navigate("Detail", {id : parseInt(notification.data.id)});
          Alert.alert('Notification : ' + msg);
        }
    };

    _pickUp = () => {
        const { cabId, location } = get(this.state, 'user');
        if (cabId && location) {
            fetch(`https://hack-slash-cab.herokuapp.com/user/${cabId}/notification`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: "Notification",
                    body: "Pickup Done",
                    data: {
                        msg: "Pickup Done"
                    }
                }),
            }).then(response => {
                return response.json();
            }).then(data => {
                console.log("ResponseDate, ", data)
                this.props.navigation.navigate("Map", { mates : this.state.mates, user : this.state.user });
            }).catch(err => {
                console.log(err, 'Error--')
            });
            // this.socket.emit('pickUp', { data: { cabId , sender :  this.state.user._id} });
        }
    };

    _markAbsent = (value) => {
        console.log(value);
        const userId = get(this.state, 'user._id');
        const cabId = get(this.state, 'user.cabId');
        if (userId && cabId) {
            console.log("Insideeeeeeeeeeeeeeeeeeeeeee")
            fetch(`http://10.1.20.149:9000/cab/${cabId}`, {
                method: 'PUT',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  presence: value,
                  userId,
                }),
            }).then(response => {
                return response.json();
            }).then(data => {
                console.log("ResponseDate >>>>>0, ", data)
                this.setState({
                    status:value
                });
            }).catch(err => {
                console.log(err, 'Error--')
            });
        }
    };

    _gotoMap = () => {
        this.props.navigation.navigate("Map", { mates : this.state.mates, user: {cabId:this.state.user.cabId} });
    };

    _keyExtractor = (item, index) => index;

  _logOut = () => {
    AsyncStorage.removeItem("auth-key");
    this.props.navigation.navigate("LoginScreen");
  };

    calling = (phoneNumber) => {
        const args = {
            number: phoneNumber,
            prompt: true
        }
        call(args).catch(console.error)
    }

  render() {
      const { user, mates,status } = this.state;
      const { navigate } =  this.props.navigation;
      console.log(mates,">???")
      const currentUser = mates.find(mate => mate.id === user._id);
        return (
            <View style={{flex: 1, backgroundColor: '#fff'}}>
              <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginRight: 12, marginTop: 60}}>
                <TouchableHighlight
                  style={styles.logOutButton}
                  onPress={this._logOut}>
                    <Text style={{color: "#ffffff", fontSize: 16}}>
                      Logout
                    </Text>
                </TouchableHighlight>
              </View>
                <ScrollView>
                  <View style={{flex: 1}}>
                    <View style={styles.base}>
                      <View style={styles.logo}>
                          <View style={styles.logoContainer}>
                              <Image
                                style={{width: 100, height: 100, borderRadius: 50}}
                                source={{uri: user.image ? user.image : 'http://res.cloudinary.com/hiuj1tri8/image/upload/v1507431020/blank_qprtf9.jpg'}}
                              />
                          </View>
                      </View>
                        <Text style={styles.userName}>{user && user.name}</Text>
                        <Text style={{fontSize: 18, fontWeight: "bold"}}>{user && user.email}</Text>
                      <View
                        style={{flex: .3, alignItems: 'center', justifyContent: 'center', marginTop: 10}}>
                        <Switch
                          value={status}
                          onValueChange={(value) => { console.log("inside mark", value); this._markAbsent(value); }}>
                        </Switch>
                      </View>
                        <View style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 20,
                        }}>
                            <TouchableHighlight
                              style={styles.button}
                              onPress={this._pickUp}
                            >
                              <Text style={{color: "#ffff"}}>Pickup Done</Text>
                            </TouchableHighlight>

                            <TouchableHighlight
                              style={[styles.button, styles.background]}
                              onPress={this._gotoMap}
                            >
                              <Text style={{color: "#fff"}}> Map </Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                    <View style={{flex: .7}}>
                        <View style={{alignItems: "center", justifyContent: "center", marginBottom: 10}}>
                            <Text style={{fontSize: 18, fontWeight: "bold"}}>Cab Mates</Text>
                        </View>
                        <FlatList
                            data={mates}
                            keyExtractor={this._keyExtractor}
                            renderItem={({item, index}) => {
                              if (item.id === user._id) return null;
                              else {
                                return (
                                  <View style={{borderBottomWidth: 1, borderColor: "#ddd"}} key={index}>
                                    <TouchableHighlight
                                      style={{flex: 1}}
                                      onPress={() => navigate("Detail", { id: item && item.id })}>
                                      <View style={{flex: 1, flexDirection: "row", alignItems: 'center'}}>
                                        <View style={{flex: 0.8, flexDirection: "row", alignItems: 'center'}}>
                                          <View style={styles.matesImage}>
                                            <Image
                                              style={{width: 30, height: 30, borderRadius: 15}}
                                              source={{uri: item.image || 'http://res.cloudinary.com/hiuj1tri8/image/upload/v1507431020/blank_qprtf9.jpg'}}
                                            />
                                          </View>
                                          <View style={styles.content}>
                                            <View><Text style={styles.title}>{item && item.name}</Text></View>
                                            <View><Text>{item && item.emailId}</Text></View>
                                          </View>
                                        </View>
                                        <View style={{flex: 0.2, flexDirection: "row",}}>
                                          <TouchableHighlight
                                            style={{flex: 1}}
                                          underlayColor='transparent'
                                          onPress={() => this.calling(item.phoneNumber)}>
                                            <View style={{width: 20, height: 20, borderRadius: 5}}>
                                              <Image
                                                style={{width: 20, height: 20}}
                                                source={{uri: 'http://res.cloudinary.com/hiuj1tri8/image/upload/v1507447627/2017-10-08_b4poao.png'}}
                                              />
                                            </View>
                                          </TouchableHighlight>
                                          <View style={item && item.presence ? styles.circle : styles.absent} />
                                        </View>
                                      </View>
                                    </TouchableHighlight>
                                  </View>
                                )
                              }
                            }}
                        />
                    </View>
                  </View>
                </ScrollView>


                {/*<Text>{this.state.notification}</Text>

                 <View style={{height: 50, alignItems: "center", justifyContent: "center", padding: 10, margin: 10}}>
                 <Text>{this.state.user.name}</Text>
                 <Text>{this.state.user.email}</Text>
                 </View>

                 <View style={{
                 height: 100,
                 alignItems: "flex-start",
                 height: 50,
                 flexDirection: 'row',
                 justifyContent: "flex-end"
                 }}>
                 <TouchableHighlight style={styles.button}
                 onPress={this._pickUp}>
                 <Text> Pickup Done </Text>
                 </TouchableHighlight>

                 <TouchableHighlight style={styles.button}
                 onPress={this._markAbsent}>
                 <Text> Absent </Text>
                 </TouchableHighlight>
                 </View>

                 <ScrollView>

                 <FlatList
                 data={this.state.users}
                 keyExtractor={this._keyExtractor}
                 renderItem={({item, index}) => <View key={index}>
                 <TouchableHighlight style={{flex: 1}} onPress={() => navigate("Detail", {id: item.id})}>
                 <View style={{flex: 1, flexDirection: "row"}}>
                 <View style={{flex: .7, flexWrap: 'wrap'}}>
                 <View style={styles.content}>
                 <View>
                 <Text style={styles.title}>{index + 1}. {item.name}</Text>
                 </View>
                 <View>
                 <Text>{item.email}</Text>
                 </View>
                 </View>
                 </View>
                 <View style={{flex: .3, alignItems: 'center', justifyContent: 'center'}}>
                 <Text> Present </Text>
                 </View>
                 </View>
                 </TouchableHighlight>
                 </View>}
                 />
                 </ScrollView>*/}

            </View>
        )
    }
}

const styles = StyleSheet.create({
  circle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    marginRight: 20,
    backgroundColor: 'green',
    marginTop: 3,
  },
  absent: {
    width: 13,
    height: 13,
    borderRadius: 50,
    marginRight: 30,
    borderWidth: 2,
    borderColor: '#d6d7da',
    marginTop: 3,
  },
    base: {
        flex: .3,
        margin: 20,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50
    },
    logoContainer: {
        height: 100,
        width: 100,
        borderRadius: 50,
        backgroundColor: 'grey'
    },
  matesImage: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: 'grey',
    marginLeft: 20,
  },
    logo: {
      flex: 0.5,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: 10,
      marginTop: -20,
  },
    container: {
        flex: 1
    },
    button: {
      padding: 12,
      width: "50%",
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fba800',
    },
    background: {
      backgroundColor: 'black',
    },
    scanbtn: {
        position: "absolute",
        bottom: 20,
        right: 20,
        height: 80,
        width: 80,
        borderRadius: 50
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    img: {
        height: 60,
        width: 60,
        backgroundColor: 'grey',
        color: "#fff",
        borderRadius: 10
    },
    content: {
        padding: 10,
    },
    listView: {
        height: 80,
        padding: 10,
        borderBottomWidth: 1,
        borderColor: 'grey'
    },
    header: {
        marginTop: 25,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'yellow',
        marginBottom: 2,
        borderBottomWidth: 1,
        borderColor: 'grey'
    },
    headerText: {
        fontSize: 18
    },
    userName: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 5
    },
    logOutButton: {
      padding: 10,
      borderRadius: 5,
      backgroundColor: '#CD5C5C',
      width: 100,
      marginTop: 5,
      alignItems: 'center',
    }
});

const mapStateToProps = (state) => {
  return {
    user: state.user,
  }
};

export default connect(mapStateToProps)(List)
