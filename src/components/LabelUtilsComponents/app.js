import React from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import axios from "axios";
import { image_base_url } from "../config.js";
import { shallowEqual } from "@babel/types";

function Test(props) {
  const [crop, setCrop] = React.useState({});
  const [label, setLabel] = React.useState("");
  const [segmentation, setSegmentation] = React.useState([]);
  const [pic, setPic] = React.useState(false);
  //const[pic, setPic] = React.useState(false);

  React.useEffect(() => {
    axios.get(image_base_url + props.match.params.dataSetId + "/images/" + props.match.params.taskId + ".jpg").then((res) => {
      console.log(res.data);
    })
  }, []);

  const showBbox = () => {
    let annotation = [{ segmentation: [[...segmentation]] }];
    setSegmentation([]);
    axios
      .get(
        "https://apulis-test.sigsus1.cn:51443/api/nfs/public/tasks/" +
        props.match.params.dataSetId + "/images/" + props.match.params.taskId + ".json",

        ({ annotation }) //just an object
      )
      .then(res => {
        return ((res.data));
      })
      .then(res => {
        let bbox = [];
        bbox.push(res.annotations[0].bbox);
        var d = document.getElementById("my-div");
        d.style.position = "absolute";
        var getBbox = bbox[0];
        d.style.left = getBbox[0] + "px";
        d.style.top = getBbox[1] + "px";
        d.style.border = "1px solid red";
        d.style.height = getBbox[2] + "px";
        d.style.width = getBbox[3] + "px";
      });
    }

    const submit = () => {
      let labl = label;
      setLabel("");
      let coordinates = crop;
      axios
        .post(
          //this is for posting data of cropping area so it is hard coded
          //getting cors origin issue here. allow your url local host in the allowed origins.
          "https://cors-anywhere.herokuapp.com/http://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public/tasks/034e7bdc-01e0-42fe-9d03-ff1c0895d182/images/546823.json", {
            label: labl,
            coordinates
          })
        .then(res => {
          console.log(res.data);
        });
    };

    return (
      <div style={{ height: "100vh" }}>
        <h1 style={{ textAlign: "center" }}>Image Labeling</h1>
        <div className="wrapper-for-image">
          {/*{pic !==false && */}
          <ReactCrop
            /* for making it reusable, i write a pattern*/
            //updated url bcoz the url has been changed in the backend;
            src={image_base_url + props.match.params.dataSetId + "/images/" + props.match.params.taskId + ".jpg"}
            //src={"https://apulis-test.sigsus1.cn:51443/api/nfs/public/tasks/034e7bdc-01e0-42fe-9d03-ff1c0895d182/images/546823.jpg"}
            crop={crop}
            onChange={newCrop => setCrop(newCrop)}
            ruleOfThirds
            renderSelectionAddon={() => (
              <input
                id="label"
                type="text"
                style={{
                  background: "transparent",
                  border: "1px lightgrey",
                  width: crop.width - 5
                }}
                value={label}
                onClick={() => {
                  {/*bring the cursor to the input field*/ }
                  document.getElementById("label").focus();
                }}
                onChange={e => setLabel(e.target.value)}
              />)}
            />
            <div id="my-div"></div>
            <button
              style={{ marginTop: "10px" }}
              className="my-btn"
              onClick={() => submit()}
            >
              Submit
            </button>
            <button
              style={{ merginTop: "10px" }}
              className="my-btn"
              onClick={() => showBbox()}
            >
              Click to see the original bbox area
            </button>
        </div>
      </div>
    );
}

export default Test;