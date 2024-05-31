countrySelector = document.getElementById('countryType');
topicSelector = document.getElementById('topicType');
mediaSelector = document.getElementById('sourceType');

countries = [];
for (item of BDS.features){
    i = item.attributes
    if(i.country && !countries.includes(i.country) ){
        option = document.createElement( 'option' );
        option.value = i.country
        option.text = i.country;
        countrySelector.add(option);
        countries.push(i.country)
    }
    
}

topics = [];
for (item of BDS.features){
    i = item.attributes
    if(i.primary_category && !topics.includes(i.primary_category) ){
        option = document.createElement( 'option' );
        option.value = i.primary_category
        option.text = i.primary_category;
        topicSelector.add(option);
        topics.push(i.primary_category)
    }
    if(i.second_category && !topics.includes(i.second_category) ){
        option = document.createElement( 'option' );
        option.value = i.second_category
        option.text = i.second_category;
        topicSelector.add(option);
        topics.push(i.second_category)
    }
    if(i.third_category && !topics.includes(i.third_category) ){
        option = document.createElement( 'option' );
        option.value = i.third_category
        option.text = i.third_category;
        topicSelector.add(option);
        topics.push(i.third_category)
    }   
}

media = [];
for (item of BDS.features){
    i = item.attributes
    if(!media.includes(i.media_type) ){
        option = document.createElement( 'option' );
        option.value = i.media_type
        option.text = i.media_type;
        mediaSelector.add(option);
        media.push(i.media_type)
    }
}