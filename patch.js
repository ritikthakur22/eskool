const fs = require('fs');
const path = './apps/mobile/src/features/profile/screens/ProfileDetailsScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// Disable photo button for student
code = code.replace(
  /<TouchableOpacity disabled=\{uploadingPhoto\} onPress=\{choosePhoto\} style=\{s.photoButton\}>/g,
  "{profile.role !== 'STUDENT' ? <TouchableOpacity disabled={uploadingPhoto} onPress={choosePhoto} style={s.photoButton}>"
);
code = code.replace(
  /<\/Text><\/\}><\/TouchableOpacity>/g,
  "</Text>}</>}</TouchableOpacity> : null}"
);

// Replace the entire form section
const renderSection = `      {profile.role !== 'STUDENT' ? (
        <>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Personal information</Text><Text style={s.editable}>EDITABLE</Text></View>
          <View style={s.card}>
            {profile.firstName ? <>{update('firstName', 'First name', 'First name', { autoCapitalize: 'words', maxLength: 80 })}{update('lastName', 'Last name', 'Last name', { autoCapitalize: 'words', maxLength: 80 })}</> : <Text style={s.helper}>Your school has not added a personal name to this account.</Text>}
            {update('email', 'Email address', 'name@example.com', { autoCapitalize: 'none', keyboardType: 'email-address' })}
            <Text style={s.helper}>Your school manages class placement and other academic records. Email changes affect the address used to sign in.</Text>
          </View>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>School details</Text><Text style={s.managed}>MANAGED BY SCHOOL</Text></View>
          <View style={s.card}>
            {readonly('School', profile.schoolName)}
            {readonly('Role', profile.role.replace('_', ' '))}
            {profile.role === 'TEACHER' ? readonly('Subjects', profile.subjects?.join(', ')) : null}
            {profile.department ? readonly('Department', profile.department) : null}
          </View>
          <TouchableOpacity disabled={saving} onPress={save} style={[s.saveButton, saving && { opacity: 0.7 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={s.saveText}>Save profile</Text></>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Student Profile</Text><Text style={s.managed}>MANAGED BY SCHOOL</Text></View>
          <View style={s.card}>
            {readonly('Full Name', [profile.firstName, profile.lastName].filter(Boolean).join(' '))}
            {readonly('Email', profile.email)}
            {readonly('Phone', profile.phone)}
            {readonly('Gender', profile.gender)}
            {readonly('Blood Group', profile.bloodGroup)}
            {readonly('Date of Birth AD', profile.dob ? new Date(profile.dob).toISOString().slice(0,10) : null)}
            {readonly('Date of Birth BS', profile.dobBs)}
            {readonly('Permanent Address', profile.address)}
            {readonly('Temporary Address', profile.temporaryAddress)}
          </View>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Academic details</Text></View>
          <View style={s.card}>
            {readonly('School', profile.schoolName)}
            {readonly('Admission No / Student ID', profile.studentId)}
            {readonly('EMIS ID / EMIS No.', profile.emisId)}
            {readonly('Admission Date', profile.admissionDate ? new Date(profile.admissionDate).toISOString().slice(0,10) : null)}
            {readonly('Class', profile.grade)}
            {readonly('Section', profile.section)}
            {readonly('Roll Number', profile.rollNo)}
          </View>
          <View style={s.sectionHeader}><Text style={s.sectionTitle}>Guardian details</Text></View>
          <View style={s.card}>
            {readonly('Father Name', profile.fatherName)}
            {readonly('Father Number', profile.fatherPhone)}
            {readonly('Mother Name', profile.motherName)}
            {readonly('Mother Number', profile.motherPhone)}
          </View>
        </>
      )}`;

code = code.replace(/<View style=\{s.sectionHeader\}><Text style=\{s.sectionTitle\}>Personal information[\s\S]*?<\/ScrollView> : null\}/, renderSection + '\n    </ScrollView> : null}');

fs.writeFileSync(path, code);
