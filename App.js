/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable consistent-return */
import React, { Component, Fragment } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Keyboard, Alert } from 'react-native'
import { MapView } from 'expo'
import { Searchbar } from 'react-native-paper'
import Spinner from 'react-native-loading-spinner-overlay'
import { GoogleSheetKey, GoogleMapsKey } from './keys'

const { Marker } = MapView

export default class App extends Component {
  state = {
    query: null,
    initialRegion: {
      latitude: 43.3096061,
      longitude: -0.373253,
      latitudeDelta: 2,
      longitudeDelta: 2,
    },
    data: [],
    spinner: true
  }

  componentDidMount = async () => {
    const url = 'https://spreadsheet.glitch.me/?key='
    try {
      const response = await fetch(url + GoogleSheetKey)
      let json = await response.json()
      console.log('json ', json)
      this.geoCoding(json)
    } catch (err) {
      console.log('err', err)
    }
  }

  geoCoding = async (params) => {
    const array = []
    for (const item of params) {
      const { streetNr, street, postcode, city, country } = item
      const newStreet = street.replace(/\s+/g, '+').toLowerCase()
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=
            ${postcode}+${streetNr}+${city}+${country}+${newStreet}
              +&key=${GoogleMapsKey}`
        )
        const jsonGeo = await response.json()
        console.log('Geo ', jsonGeo.results[0].geometry.location)
        const location = {
          latitude: jsonGeo.results[0].geometry.location.lat,
          longitude: jsonGeo.results[0].geometry.location.lng
        }
        item.coordinate = location
        console.log('i', item)
        array.push(item)
      } catch (err) {
        console.log('err', err)
      }
    }
    // console.log("array", array)

    const initialCoords = array[Math.floor(Math.random() * array.length)].coordinate
    const deltas = { latitudeDelta: 2, longitudeDelta: 2 }

    this.setState(prevState => ({
      data: [...prevState.data, ...array],
      initialRegion: { ...initialCoords, ...deltas },
      spinner: false,
    }))
  }

  renderSites = () => {
    const renderedSites = this.state.data.map((site) => {
      const { coordinate, email, name } = site
      return (
        <Marker key={email} coordinate={coordinate}>
          <MapView.Callout>
            <View style={styles.markerText}>
              <Text>{name}</Text>
              <Text>{email}</Text>
            </View>
          </MapView.Callout>
        </Marker>
      )
    })
    return renderedSites
  }

  renderMap = () => {
    return (
      <MapView
        style={{ flex: 1 }}
        region={this.state.region || this.state.initialRegion}
        rotateEnabled={false}
        onRegionChangeComplete={(data) => {
          console.log('onRegionChangeComplete', data)
          this.setState({ region: data })
        }}
        onCalloutPress={() => console.log('Pressed')}
      >
        {this.renderSites()}
      </MapView>
    )
  };

  autoComplete = (Arr, Input) =>
    Arr.filter(e =>
      e.toLowerCase()
        .includes(Input
          .toLowerCase()))

  onSelection = (result) => {
    const arr = this.state.data.filter(i => i.city === result)
    let { coordinate } = arr[0]
    const deltas = { latitudeDelta: 2, longitudeDelta: 2 }
    coordinate = { ...coordinate, ...deltas }
    console.log('coordinate', coordinate)
    this.setState({
      region: { ...this.state.region, ...coordinate },
      query: null
    })
    Keyboard.dismiss()
  }

  renderSearchResults = () => {
    const cities = this.state.data.map(i => i.city)
    console.log("cities", cities)
    const results = this.autoComplete(cities, this.state.query)
    const items = results.map((result, index) => (
      <TouchableOpacity
        key={index}
        style={styles.searchKey}
        onPress={() => this.onSelection(result)}
      >
        <Text style={{ left: 20 }}>{result}</Text>
      </TouchableOpacity>
    ))

    return (
      <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="always">
        {items}
      </ScrollView>
    )
  }

  render() {
    console.log("state", this.state.region)
    if (!this.state.data.length) {
      return (
        <View style={styles.container}>
          <Spinner
            visible={this.state.spinner}
            textContent={'Loading...'}
            textStyle={styles.spinnerTextStyle}
          />
        </View>
      )
    }

    return (
      <View style={{ flex: 1 }}>
        {this.renderMap()}
        <Searchbar
          style={styles.searchBar}
          placeholder="Search"
          onChangeText={query => this.setState({ query })}
          value={this.state.query}
          ref={(searchBar) => { this.searchBar = searchBar }}
        />
        {this.state.query ? this.renderSearchResults() : null}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  spinnerTextStyle: {
    color: '#FFF'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  markerText: {
    height: 100,
    width: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  searchResults: {
    position: 'absolute',
    top: 100,
    width: 300,
    backgroundColor: 'white',
    alignSelf: 'center'
  },
  searchBar: {
    position: 'absolute',
    zIndex: 999,
    top: 50,
    width: 300,
    alignSelf: 'center',
    borderRadius: 20
  },
  searchKey: {
    height: 50,
    width: 300,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'gray'
  }
})
