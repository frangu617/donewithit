import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const App = () => {
  const [location, setLocation] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customClockIn, setCustomClockIn] = useState(new Date());
  const [customClockOut, setCustomClockOut] = useState(new Date());
  const [isClockInPickerVisible, setClockInPickerVisibility] = useState(false);
  const [isClockOutPickerVisible, setClockOutPickerVisibility] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingSpinner(false);
    }, 50000);

    fetchWorkLogs();

    return () => clearTimeout(timer);
  }, []);

  const fetchWorkLogs = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem("workLogs");
      const parsedLogs = storedLogs ? JSON.parse(storedLogs) : [];
      setLogs(parsedLogs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching work logs:", error);
      setLoading(false);
    }
  };

  const handleClockInOut = async () => {
    try {
      if (logs.length % 2 === 0 && !location.trim()) {
        Alert.alert("Error", "Please enter a location.");
        return;
      }

      const type = logs.length % 2 === 0 ? "Clock In" : "Clock Out";
      const time = new Date();
      const newLocation =
        type === "Clock Out" ? logs[logs.length - 1]?.location : location;
      const newLog = { location: newLocation, type, time };

      const updatedLogs = [...logs, newLog];
      await AsyncStorage.setItem("workLogs", JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      if (type === "Clock In") {
        setLocation("");
      }
    } catch (error) {
      console.error("Error clocking in/out:", error);
    }
  };

  const handleDelete = async (index) => {
    try {
      const updatedLogs = logs.filter((_, i) => i !== index);
      await AsyncStorage.setItem("workLogs", JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const handleDeleteWeek = async (weekRange) => {
    try {
      const updatedLogs = logs.filter((log) => {
        const logDate = new Date(log.time);
        const weekStart = new Date(weekRange.split("-")[0]);
        const weekEnd = new Date(weekRange.split("-")[1]);
        return !(logDate >= weekStart && logDate <= weekEnd);
      });
      await AsyncStorage.setItem("workLogs", JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
    } catch (error) {
      console.error("Error deleting week logs:", error);
    }
  };

  const handleAddCustomLog = async () => {
    try {
      if (!location.trim()) {
        Alert.alert("Error", "Please enter a location.");
        return;
      }
      if (customClockOut <= customClockIn) {
        Alert.alert("Error", "Clock-out time must be after clock-in time.");
        return;
      }

      const newLog = [
        { location, type: "Clock In", time: customClockIn },
        { location, type: "Clock Out", time: customClockOut },
      ];

      const updatedLogs = [...logs, ...newLog];
      await AsyncStorage.setItem("workLogs", JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
      setShowModal(false);
      setLocation("");
    } catch (error) {
      console.error("Error adding custom log:", error);
    }
  };

  const groupLogsByWeek = () => {
    const groupedLogs = {};
    logs.forEach((log) => {
      if (log && log.time) {
        const logDate = new Date(log.time);
        const weekStart = new Date(logDate);
        weekStart.setDate(
          logDate.getDate() -
            logDate.getDay() +
            (logDate.getDay() === 0 ? -6 : 1)
        );
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekRange =
          weekStart.toDateString() + "-" + weekEnd.toDateString();

        if (!groupedLogs[weekRange]) {
          groupedLogs[weekRange] = [];
        }
        groupedLogs[weekRange].push(log);
      }
    });
    return groupedLogs;
  };

  const calculateTotalHours = (logs) => {
    let totalHours = 0;
    for (let i = 0; i < logs.length; i += 2) {
      if (logs[i] && logs[i + 1]) {
        const clockInTime = new Date(logs[i].time);
        const clockOutTime = new Date(logs[i + 1].time);
        totalHours += (clockOutTime - clockInTime) / (1000 * 60 * 60);
      }
    }
    return totalHours.toFixed(2);
  };

  const showClockInPicker = () => {
    setClockInPickerVisibility(true);
  };

  const hideClockInPicker = () => {
    setClockInPickerVisibility(false);
  };

  const handleClockInConfirm = (date) => {
    setCustomClockIn(date);
    hideClockInPicker();
  };

  const showClockOutPicker = () => {
    setClockOutPickerVisibility(true);
  };

  const hideClockOutPicker = () => {
    setClockOutPickerVisibility(false);
  };

  const handleClockOutConfirm = (date) => {
    setCustomClockOut(date);
    hideClockOutPicker();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Work Hours Tracker</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter location"
        value={location}
        onChangeText={(text) => setLocation(text)}
        editable={
          logs.length === 0 || logs[logs.length - 1]?.type === "Clock Out"
        }
      />
      <Button
      style={styles.button}
        title={`Clock ${logs.length % 2 === 0 ? "In" : "Out"}`}
        onPress={handleClockInOut}
      />
      <Button 
      style={styles.button}
      title="Add Custom Hours" onPress={() => setShowModal(true)} />
      {loading ? (
        <View style={styles.loadingContainer}>
          {showLoadingSpinner && (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
          {showLoadingSpinner && <Text>Loading data...</Text>}
          {!showLoadingSpinner && (
            <Text>Data loading is taking longer than expected...</Text>
          )}
        </View>
      ) : (
        Object.entries(groupLogsByWeek()).map(([weekRange, weekLogs]) => (
          <View key={weekRange} style={styles.weekContainer}>
            <Text style={styles.weekRange}>
              {weekRange} (Total Hours: {calculateTotalHours(weekLogs)})
            </Text>
            <Button
              title="Delete Week"
              onPress={() => handleDeleteWeek(weekRange)}
              color="red"
            />
            {weekLogs.map((log, index) => {
              const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Los_Angeles",
                hour12: true,
              });
              const formattedTime = dateTimeFormat.format(new Date(log.time));

              return (
                <View key={index} style={styles.logContainer}>
                  <View style={styles.logDetails}>
                    <Text style={styles.logText}>{log.location}</Text>
                    <Text style={styles.logText}>{log.type}</Text>
                    <Text style={styles.logText}>{formattedTime}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(logs.indexOf(log))}
                  >
                    <Text style={styles.deleteButton}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))
      )}
      <Modal visible={showModal} transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Hours</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={location}
              onChangeText={(text) => setLocation(text)}
            />
            <Text>Clock In Time:</Text>
            <TouchableOpacity onPress={showClockInPicker}>
              <Text style={styles.dateText}>
                {customClockIn.toLocaleString()}
              </Text>
            </TouchableOpacity>
            <Text>Clock Out Time:</Text>
            <TouchableOpacity onPress={showClockOutPicker}>
              <Text style={styles.dateText}>
                {customClockOut.toLocaleString()}
              </Text>
            </TouchableOpacity>
            <Button style={styles.button} title="Add Log" onPress={handleAddCustomLog} />

            <Button
              title="Cancel"
              onPress={() => setShowModal(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>
      <DateTimePickerModal
        isVisible={isClockInPickerVisible}
        mode="datetime"
        onConfirm={handleClockInConfirm}
        onCancel={hideClockInPicker}
      />
      <DateTimePickerModal
        isVisible={isClockOutPickerVisible}
        mode="datetime"
        onConfirm={handleClockOutConfirm}
        onCancel={hideClockOutPicker}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 30,
    textAlign: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    elevation: 2,
    bordershadowColor: "#000",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,

  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },
  dateText: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
  },
  weekContainer: {
    marginTop: 20,
    marginBottom: 20,
    bordershadowColor: "#000",
  },
  weekRange: {
    fontSize: 18,
    fontWeight: "bold",
    // marginBottom: 10,
    textAlign: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    elevation: 2,
  },
  logContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 2,
  },
  logDetails: {
    flex: 1,
    marginRight: 10,
  },
  logText: {
    fontSize: 16,
  },
  deleteButton: {
    color: "white",
    fontWeight: "bold",
    backgroundColor: "red",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
});

export default App;
