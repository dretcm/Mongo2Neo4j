let url = "", user='', password='';
const host = 'http://127.0.0.1:5000/';
const host_query = host + "mongo_query";
var driver, session;
const request = new XMLHttpRequest();

document.addEventListener('DOMContentLoaded', () => {
    request.open('GET', host + 'auth_neo4j');
    request.send();

    request.onload = () => {
        const data = JSON.parse(request.responseText);
            //console.log(data);
        url = data["url"];
        user = data["user"];
        password = data["password"];
        driver = neo4j.driver(url, neo4j.auth.basic(user, password));
        session = driver.session();
    }

    document.getElementById('query').addEventListener('keydown', function(event) {
      if (event.key == 'Enter') {
        event.preventDefault(); // Evita el comportamiento predeterminado del Enter (enviar formulario)
        match();
      }
    });
});


function match(){
    const query = document.getElementById('query').value;

    request.open('POST', host_query);
    const data = new FormData();
    data.append('query', query);
    request.send(data);

    request.onload = () => {
        const json = JSON.parse(request.responseText);
        const container = document.getElementById('graph-container');
        //const info = document.getElementById('inputs');
        container.innerHTML = "";

        if(json["success"]==true){
            console.log(json["data"]);
            const nodes = new vis.DataSet([]), edges= new vis.DataSet([]);
            const options = {};
            const focus = 'p_graph';
            const data_mongo = json["data"];
            const node_label = ["Movie", "Genre"];
            const map_node = ["title","name"];

            let disperso = document.getElementById("disperso").checked;
            let genres = document.getElementById("genres").checked;
            let companies = document.getElementById("companies").checked;
            let countrys = document.getElementById("countrys").checked;
            let languages = document.getElementById("languages").checked;

            if(disperso || genres || companies || countrys || languages){

                var configs = {};

                if(disperso){
                    configs.skipValidation = true;
                    configs.mappings={};
                    configs.mappings['$'] = 'Movie{!title, @belongs_to_collection,*}';   //`${node_label[0]}{!${map_node[0]}, @belongs_to_collection,*}`;
                }
                else{
                    configs.mappings={};
                    configs.mappings['$'] = 'Movie{!title, @belongs_to_collection,_id}';   //`${node_label[0]}{!${map_node[0]}, @belongs_to_collection,_id}`;
                }

                if(genres)
                    configs.mappings['$.genres'] = 'Genre{!name,*}';   //`${node_label[1]}{!${map_node[1]},*}`;
                
                if(companies)
                    configs.mappings['$.production_companies'] = 'Compani{!name,*}';

                if(countrys)
                    configs.mappings['$.production_countries'] = 'Country{!name,*}';

                if(languages)
                    configs.mappings['$.spoken_languages'] = 'Language{!name,*}';

                session.run('CALL apoc.graph.fromDocument($data_mongo , $configs) YIELD graph AS p_graph RETURN p_graph', { data_mongo , configs})
                .then(result => {
                    //console.log(result);
                    const record = result.records[0].get(focus);
                    //console.log(record);
                    record.nodes.forEach(item => {
                        //console.log(item);
                        let properties = item.properties;
                        data_mongo.forEach(record => {
                            if("_id" in item.properties && item.properties._id == record["_id"])
                                properties = record;
                        });
                        const nodeObject = {
                            id: item.elementId,
                            //label: item.properties[map_node[item.labels[0]==node_label[0] ? 0 : 1]],
                            label: item.properties[map_node[map_node[0] in item.properties ? 0 : 1]],
                            title: item.labels[0],//node.start.labels[0]// Propiedad de nombre del nodo
                            description : properties
                        };
                        nodes.add(nodeObject);
                    });

                    record.relationships.forEach(item => {
                        //console.log(item);
                        const edgeObject = {
                            id: item.elementId,
                            from: item.startNodeElementId,
                            to: item.endNodeElementId,
                            label: item.type
                        };
                        const aux = nodes.get(item.endNodeElementId)
                        if(aux.title==undefined){
                            aux.title = item.type;
                            nodes.update(aux);
                        }
                        edges.add(edgeObject);
                    });
                })
                .catch(error => {
                    console.error('Error al ejecutar la consulta:', error);
                    container.style.background = 'red';
                })
            }
            else{
                data_mongo.forEach(record => {
                    //console.log(record);
                    const nodeObject = {
                        id: record['_id'],//con,
                        label: record['title'],
                        title: "Movies",
                        description : record
                    };
                    nodes.add(nodeObject);
                });
            }

            const data = {nodes:nodes, edges:edges};
            const network = new vis.Network(container, data, options);
            network.setData(data);
            container.style.background = 'white';

            network.on("click", function(event) {
                const nodeId = event.nodes[0]; // Obtiene el ID del nodo clicado
                const node = nodes.get(nodeId); // Obtiene el objeto del nodo por su ID
                const label = node.id; // Obtiene la etiqueta del nodo

                /*
                if (document.getElementById("info") != null)
                  info.removeChild(document.getElementById("info"));
                */
                if(label!=undefined){
                    const descrip = JSON.stringify(node.description, null, 2);
                    /*
                    const div_con = document.createElement("div");
                    div_con.setAttribute("id", "info");
                    const p = document.createElement("p");
                    p.innerHTML = "ID: " + node.id +"<br> </pre> " + descrip +"</pre>";
                    div_con.appendChild(p);
                    info.appendChild(div_con);
                    */
                    const newTab = window.open("", "_blank"); // Abre una nueva pestaña en blanco
                    newTab.document.write(`<pre>${descrip}</pre>`); // Escribe el contenido en la nueva pestaña
                    newTab.document.close();

                }
            });            
        }
        else{
            container.style.background = 'red';
            //if (document.getElementById("info") != null)
                //info.removeChild(document.getElementById("info"));
        }
    }
}